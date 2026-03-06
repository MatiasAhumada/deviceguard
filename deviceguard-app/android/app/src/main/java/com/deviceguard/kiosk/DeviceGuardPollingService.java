package com.deviceguard.kiosk;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Foreground Service que mantiene el polling al servidor aunque la app esté
 * cerrada. Detecta cambios de estado (bloqueado/desbloqueado) y activa o
 * desactiva el modo kiosk sin necesidad de que el usuario abra la app.
 * 
 * ESTRATEGIA DE POLLING INTELIGENTE:
 * - Cuando NO está bloqueado: Polling cada 30 segundos para detectar bloqueo
 * - Cuando está BLOQUEADO: 
 *   • Polling NORMAL se DETIENE completamente (cero consultas al servidor)
 *   • Solo verificación LOCAL de SharedPreferences
 *   • Fallback MUY lento: consulta al servidor cada 5 minutos como último recurso
 *
 * Ciclo de vida:
 *  - Arranca cuando la app termina la vinculación (llamado desde DeviceModule)
 *  - Arranca en BOOT_COMPLETED via DeviceAdmin si el dispositivo ya estaba vinculado
 *  - Se mantiene vivo con START_STICKY (Android lo reinicia si lo mata)
 *  - Usa AlarmManager para auto-reiniciarse en caso de ser detenido forzosamente
 */
public class DeviceGuardPollingService extends Service {

    private static final String TAG = "DGPollingService";
    private static final String CHANNEL_ID = "deviceguard_polling";
    private static final int NOTIFICATION_ID = 1001;
    
    // Polling cada 30 segundos cuando NO está bloqueado (suficiente para detección)
    private static final long POLL_INTERVAL_NORMAL_MS = 30000;
    // Fallback de desbloqueo: cada 5 minutos verifica si el servidor desbloqueó
    // Esto es solo por si la app no puede recibir notificaciones push
    private static final long UNLOCK_FALLBACK_INTERVAL_MS = 300000; // 5 minutos
    
    private static final long RESTART_DELAY_MS = 2000; // 2 segundos para restart

    static final String PREFS_NAME = "DeviceGuardPrefs";
    static final String KEY_DEVICE_ID = "deviceId";
    static final String KEY_API_URL = "apiUrl";
    static final String KEY_IS_LINKED = "isLinked";
    static final String KEY_IS_LOCKED = "isLocked";
    static final String KEY_LOCKDOWN_ACTIVE = "isFullLockdownActive";

    private Handler handler;
    private boolean lastKnownBlocked = false;
    private static boolean sIsRunning = false;
    private AlarmManager alarmManager;
    private PendingIntent pollPendingIntent;
    private PendingIntent unlockFallbackPendingIntent;

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            pollServer();
            handler.postDelayed(this, POLL_INTERVAL_NORMAL_MS);
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // Ciclo de vida del Service
    // ─────────────────────────────────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        createNotificationChannel();
        sIsRunning = true;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        
        // Manejar fallback de desbloqueo
        if ("com.deviceguard.kiosk.ACTION_UNLOCK_FALLBACK".equals(action)) {
            handleUnlockFallback();
            // Re-programar fallback
            scheduleUnlockFallback();
            return START_STICKY;
        }
        
        // Verificar que el dispositivo esté vinculado antes de hacer polling
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isLinked = prefs.getBoolean(KEY_IS_LINKED, false);

        if (!isLinked) {
            Log.d(TAG, "Device not linked yet, stopping service.");
            stopSelf();
            return START_NOT_STICKY;
        }

        // Inicializar el último estado conocido de bloqueo desde SharedPreferences
        lastKnownBlocked = prefs.getBoolean(KEY_IS_LOCKED, false);

        // Promover al servicio a foreground (Android exige una notificación)
        startForeground(NOTIFICATION_ID, buildNotification());

        // Iniciar el servicio persistente guardián
        PersistentService.start(this);
        Log.i(TAG, "PersistentService guardian started");

        // Iniciar el polling SOLO si no está bloqueado
        if (!lastKnownBlocked) {
            startPolling();
        } else {
            Log.i(TAG, "Device is LOCKED - stopping polling. Waiting for server unlock command.");
            // Programar verificación LOCAL del estado (no polling al servidor)
            scheduleLocalStateCheck();
            // Programar fallback MUY lento (5 min)
            scheduleUnlockFallback();
        }

        Log.i(TAG, "Polling service started. lastKnownBlocked=" + lastKnownBlocked);
        
        // Programar watchdog para reinicio automático si el servicio se detiene
        scheduleWatchdog();
        
        return START_STICKY; // Android reinicia el servicio si lo mata
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(pollRunnable);
        sIsRunning = false;
        Log.w(TAG, "Polling service destroyed. Scheduling restart...");
        // Programar reinicio inmediato si se destruye inesperadamente
        scheduleImmediateRestart();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // El usuario intentó cerrar la app desde recent apps
        // Reiniciar el servicio inmediatamente
        Log.w(TAG, "Task removed. Restarting service...");
        scheduleImmediateRestart();
        super.onTaskRemoved(rootIntent);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Polling
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Inicia el polling al servidor solo cuando el dispositivo NO está bloqueado.
     */
    private void startPolling() {
        // Primero detener cualquier polling existente
        stopPolling();
        
        handler.post(pollRunnable);
        Log.i(TAG, "Polling STARTED with interval: " + POLL_INTERVAL_NORMAL_MS + "ms");
    }

    /**
     * Detiene el polling al servidor de forma definitiva.
     */
    private void stopPolling() {
        handler.removeCallbacks(pollRunnable);
        Log.i(TAG, "Polling STOPPED - no server requests will be made");
    }

    private void pollServer() {
        // Log para debuggear si el polling se está ejecutando cuando no debería
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isLocked = prefs.getBoolean(KEY_IS_LOCKED, false);
        
        if (isLocked) {
            Log.e(TAG, "⚠️ POLLING EXECUTED WHILE LOCKED! This should not happen. Stopping immediately.");
            stopPolling();
            return;
        }
        
        String deviceId = prefs.getString(KEY_DEVICE_ID, null);
        String apiUrl = prefs.getString(KEY_API_URL, null);

        if (deviceId == null || apiUrl == null) {
            Log.w(TAG, "Missing deviceId or apiUrl, skipping poll.");
            return;
        }

        Log.d(TAG, "Polling server for deviceId: " + deviceId);

        try {
            // GET /api/device-syncs/{deviceId}
            String endpoint = apiUrl + "/api/device-syncs/" + deviceId;
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                Log.w(TAG, "Poll returned HTTP " + responseCode);
                conn.disconnect();
                return;
            }

            // Leer respuesta JSON manualmente (sin librería externa)
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            conn.disconnect();

            String body = sb.toString();
            // Parseo simple: buscar "blocked":true o "blocked":false
            boolean isBlocked = body.contains("\"blocked\":true");

            Log.d(TAG, "Poll result — blocked=" + isBlocked + " lastKnown=" + lastKnownBlocked);

            if (isBlocked && !lastKnownBlocked) {
                // Transición: libre → bloqueado
                lastKnownBlocked = true;
                onDeviceBlocked();
            } else if (!isBlocked && lastKnownBlocked) {
                // Transición: bloqueado → libre
                lastKnownBlocked = false;
                onDeviceUnblocked();
            }

        } catch (Exception e) {
            Log.w(TAG, "Poll failed (network?): " + e.getMessage());
        }
    }

    /**
     * Maneja el fallback de desbloqueo: consulta al servidor para ver si el dispositivo
     * fue desbloqueado remotamente. Esto ocurre cada 5 minutos cuando está bloqueado.
     */
    private void handleUnlockFallback() {
        Log.d(TAG, "Unlock fallback: checking if server unlocked device");
        
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String deviceId = prefs.getString(KEY_DEVICE_ID, null);
        String apiUrl = prefs.getString(KEY_API_URL, null);

        if (deviceId == null || apiUrl == null) {
            Log.w(TAG, "Missing deviceId or apiUrl for unlock fallback.");
            return;
        }

        try {
            String endpoint = apiUrl + "/api/device-syncs/" + deviceId;
            URL url = new URL(endpoint);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(4000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                Log.w(TAG, "Unlock fallback returned HTTP " + responseCode);
                conn.disconnect();
                return;
            }

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            conn.disconnect();

            String body = sb.toString();
            // Buscar "blocked":false en la respuesta
            boolean isBlocked = body.contains("\"blocked\":true");
            
            if (!isBlocked && lastKnownBlocked) {
                Log.i(TAG, "Unlock fallback: server reports device is UNBLOCKED");
                onDeviceUnblocked();
            } else {
                Log.d(TAG, "Unlock fallback: device still blocked");
            }

        } catch (Exception e) {
            Log.w(TAG, "Unlock fallback failed: " + e.getMessage());
        }
    }

    /**
     * Programa una verificación LOCAL del estado para detectar desbloqueo.
     * Esto NO hace polling al servidor, solo verifica SharedPreferences.
     * Se ejecuta cada 2 segundos cuando está bloqueado.
     */
    private void scheduleLocalStateCheck() {
        handler.postDelayed(() -> {
            if (!sIsRunning) return;
            
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isCurrentlyLocked = prefs.getBoolean(KEY_IS_LOCKED, false);
            
            // Si el estado cambió a desbloqueado (por acción externa), reanudar polling
            if (!isCurrentlyLocked && lastKnownBlocked) {
                Log.i(TAG, "Device unlocked via external action - resuming polling");
                lastKnownBlocked = false;
                stopUnlockFallback();
                startPolling();
            } else if (isCurrentlyLocked) {
                // Seguir verificando localmente cada 2 segundos
                scheduleLocalStateCheck();
            }
        }, 2000);
    }

    /**
     * Programa un fallback de desbloqueo que consulta al servidor cada 5 minutos.
     * Esto es solo por si el servidor necesita desbloquear el dispositivo remotamente.
     * Es un ÚLTIMO RECURSO - la frecuencia muy baja para no sobrecargar el servidor.
     */
    private void scheduleUnlockFallback() {
        if (alarmManager == null) return;

        Intent intent = new Intent(this, DeviceGuardPollingService.class);
        intent.setAction("com.deviceguard.kiosk.ACTION_UNLOCK_FALLBACK");
        unlockFallbackPendingIntent = PendingIntent.getService(
            this,
            2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + UNLOCK_FALLBACK_INTERVAL_MS,
                unlockFallbackPendingIntent
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + UNLOCK_FALLBACK_INTERVAL_MS,
                unlockFallbackPendingIntent
            );
        }

        Log.d(TAG, "Unlock fallback scheduled for " + (UNLOCK_FALLBACK_INTERVAL_MS / 1000 / 60) + " minutes");
    }

    /**
     * Cancela el fallback de desbloqueo.
     */
    private void stopUnlockFallback() {
        if (alarmManager != null && unlockFallbackPendingIntent != null) {
            alarmManager.cancel(unlockFallbackPendingIntent);
            Log.d(TAG, "Unlock fallback cancelled");
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Acciones al cambiar el estado
    // ─────────────────────────────────────────────────────────────────────

    private void onDeviceBlocked() {
        Log.i(TAG, "Device BLOCKED — activating kiosk, stopping server polling");

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean(KEY_IS_LOCKED, true)
             .putBoolean(KEY_LOCKDOWN_ACTIVE, true)
             .apply();

        // DETENER polling al servidor - cero consultas cuando está bloqueado
        stopPolling();
        
        // Programar verificación LOCAL (sin servidor) para detectar desbloqueo
        scheduleLocalStateCheck();
        
        // Programar fallback MUY lento (5 min) por si el servidor necesita desbloquear
        scheduleUnlockFallback();

        // Activar Lock Task via DevicePolicyManager
        DevicePolicyManager dpm = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName admin = new ComponentName(this, DeviceAdmin.class);

        if (dpm.isDeviceOwnerApp(getPackageName())) {
            try {
                String[] packages = {getPackageName()};
                dpm.setLockTaskPackages(admin, packages);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    dpm.setLockTaskFeatures(admin, DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
                }
                dpm.setKeyguardDisabled(admin, true);
            } catch (Exception e) {
                Log.e(TAG, "Error setting lock task packages: " + e.getMessage());
            }
        }

        // Despertar pantalla con múltiples flags
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            @SuppressWarnings("deprecation")
            PowerManager.WakeLock wl = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                PowerManager.FULL_WAKE_LOCK |
                PowerManager.ACQUIRE_CAUSES_WAKEUP |
                PowerManager.ON_AFTER_RELEASE,
                "DeviceGuard::LockWakeLock"
            );
            wl.acquire(10000); // 10 segundos
            Log.i(TAG, "Screen wake lock acquired");
        }

        // Esperar 500ms para que la pantalla despierte
        handler.postDelayed(() -> {
            // Abrir la app en la pantalla de bloqueo
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP |
                Intent.FLAG_ACTIVITY_NO_ANIMATION
            );
            intent.putExtra("navigate_to", "device-blocked");
            
            try {
                startActivity(intent);
                Log.i(TAG, "MainActivity started for blocked state");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start MainActivity: " + e.getMessage());
            }
        }, 500);
    }

    private void onDeviceUnblocked() {
        Log.i(TAG, "Device UNBLOCKED — resuming normal polling");

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
             .putBoolean(KEY_IS_LOCKED, false)
             .putBoolean(KEY_LOCKDOWN_ACTIVE, false)
             .apply();

        // Detener fallback de desbloqueo
        stopUnlockFallback();

        // REANUDAR polling normal al servidor
        startPolling();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Notificación silenciosa (requerida por Android para foreground service)
    // ─────────────────────────────────────────────────────────────────────

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "DeviceGuard",
                    NotificationManager.IMPORTANCE_MIN // sin sonido ni popup
            );
            channel.setDescription("Monitoreo de seguridad en segundo plano");
            channel.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
                .setContentTitle("DeviceGuard")
                .setContentText("Protección activa")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .setContentIntent(pendingIntent)
                .setOngoing(true)     // no se puede descartar
                .setPriority(Notification.PRIORITY_MIN)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Helper estático para iniciar/detener el servicio desde otros lugares
    // ─────────────────────────────────────────────────────────────────────

    public static void start(Context context) {
        Intent intent = new Intent(context, DeviceGuardPollingService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        // Cancelar watchdog antes de detener
        cancelWatchdog(context);
        context.stopService(new Intent(context, DeviceGuardPollingService.class));
    }

    public static boolean isRunning() {
        return sIsRunning;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Watchdog y mecanismos de auto-reinicio
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Programa un watchdog que verifica periódicamente si el servicio está corriendo.
     * Si el servicio se detiene inesperadamente, lo reinicia automáticamente.
     */
    private void scheduleWatchdog() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(this, DeviceGuardPollingService.class);
        intent.setAction("com.deviceguard.kiosk.ACTION_WATCHDOG");
        PendingIntent pendingIntent = PendingIntent.getService(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Usar setExactAndAllowWhileIdle para máxima precisión incluso en Doze mode
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + (POLL_INTERVAL_NORMAL_MS * 2),
                pendingIntent
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + (POLL_INTERVAL_NORMAL_MS * 2),
                pendingIntent
            );
        }

        Log.d(TAG, "Watchdog scheduled for " + (POLL_INTERVAL_NORMAL_MS * 2) + "ms");
    }

    /**
     * Cancela el watchdog programado.
     */
    private static void cancelWatchdog(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, DeviceGuardPollingService.class);
        intent.setAction("com.deviceguard.kiosk.ACTION_WATCHDOG");
        PendingIntent pendingIntent = PendingIntent.getService(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.cancel(pendingIntent);
        Log.d(TAG, "Watchdog cancelled");
    }

    /**
     * Programa un reinicio inmediato del servicio usando AlarmManager.
     * Esto asegura que el servicio se reinicie incluso si Android lo mata forzosamente.
     */
    private void scheduleImmediateRestart() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(this, DeviceGuardPollingService.class);
        PendingIntent pendingIntent = PendingIntent.getService(
            this,
            1, // Different request code
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + RESTART_DELAY_MS,
                pendingIntent
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + RESTART_DELAY_MS,
                pendingIntent
            );
        }

        Log.i(TAG, "Immediate restart scheduled in " + RESTART_DELAY_MS + "ms");
    }
}
