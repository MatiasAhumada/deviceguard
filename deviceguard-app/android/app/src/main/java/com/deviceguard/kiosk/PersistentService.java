package com.deviceguard.kiosk;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

/**
 * Servicio de persistencia que asegura que DeviceGuardPollingService siempre esté corriendo.
 * 
 * Este servicio actúa como un "guardián" que monitorea el estado del polling service
 * y lo reinicia si se detiene por cualquier razón. Usa múltiples mecanismos:
 * - AlarmManager para verificaciones periódicas
 * - WakeLocks para mantener el CPU activo
 * - Auto-reinicio en onDestroy
 * 
 * IMPORTANTE: Verifica cada 60 segundos para reducir consumo de recursos.
 */
public class PersistentService extends Service {

    private static final String TAG = "PersistentService";
    private static final long CHECK_INTERVAL_MS = 60000; // 60 segundos

    private Handler handler;
    private PowerManager.WakeLock wakeLock;
    private static boolean sIsRunning = false;

    private final Runnable checkRunnable = new Runnable() {
        @Override
        public void run() {
            ensurePollingServiceRunning();
            handler.postDelayed(this, CHECK_INTERVAL_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        sIsRunning = true;
        Log.i(TAG, "PersistentService created");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.i(TAG, "PersistentService started");

        // Adquirir wake lock parcial para mantener el CPU activo
        acquireWakeLock();

        // Iniciar verificación periódica
        handler.removeCallbacks(checkRunnable);
        handler.post(checkRunnable);

        // Verificación inmediata
        ensurePollingServiceRunning();

        // Programar alarma de respaldo
        scheduleBackupAlarm();

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.w(TAG, "PersistentService destroyed. Restarting...");
        handler.removeCallbacks(checkRunnable);
        releaseWakeLock();
        sIsRunning = false;

        // Programar reinicio inmediato
        scheduleRestart();

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.w(TAG, "Task removed. Restarting PersistentService and app...");
        
        SharedPreferences prefs = getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE);
        boolean isLocked = prefs.getBoolean("isLocked", false);
        boolean isLinked = prefs.getBoolean("isLinked", false);
        
        if (isLinked) {
            // Despertar pantalla primero
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "DeviceGuard::TaskRemovedWakeLock"
                );
                wl.acquire(3000);
            }
            
            // Reabrir app inmediatamente
            Intent launchIntent = getPackageManager()
                    .getLaunchIntentForPackage(getPackageName());
            if (launchIntent != null) {
                launchIntent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
                );
                if (isLocked) {
                    launchIntent.putExtra("navigate_to", "device-blocked");
                }
                startActivity(launchIntent);
                Log.i(TAG, "App relaunched after task removal");
            }
        }
        
        scheduleRestart();
        super.onTaskRemoved(rootIntent);
    }

    /**
     * Verifica que DeviceGuardPollingService esté corriendo y lo inicia si no.
     */
    private void ensurePollingServiceRunning() {
        if (!DeviceGuardPollingService.isRunning()) {
            Log.w(TAG, "PollingService not running. Starting it now...");
            DeviceGuardPollingService.start(this);
        } else {
            Log.d(TAG, "PollingService is running");
        }
    }

    /**
     * Adquiere un wake lock parcial para mantener el CPU activo.
     */
    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "DeviceGuard::PersistentWakeLock"
                );
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(10 * 60 * 1000L); // 10 minutos máximo
                Log.d(TAG, "WakeLock acquired");
            }
        }
    }

    /**
     * Libera el wake lock.
     */
    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "WakeLock released");
        }
    }

    /**
     * Programa una alarma de respaldo que verifica el servicio cada 5 minutos.
     */
    private void scheduleBackupAlarm() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(this, PersistentService.class);
        PendingIntent pendingIntent = PendingIntent.getService(
            this,
            100,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + CHECK_INTERVAL_MS,
                pendingIntent
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + CHECK_INTERVAL_MS,
                pendingIntent
            );
        }
    }

    /**
     * Programa un reinicio inmediato del servicio.
     */
    private void scheduleRestart() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(this, PersistentService.class);
        PendingIntent pendingIntent = PendingIntent.getService(
            this,
            101,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 2000,
                pendingIntent
            );
        } else {
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 2000,
                pendingIntent
            );
        }

        Log.i(TAG, "Restart scheduled in 2 seconds");
    }

    /**
     * Inicia el PersistentService.
     */
    public static void start(Context context) {
        Intent intent = new Intent(context, PersistentService.class);
        context.startService(intent);
    }

    /**
     * Detiene el PersistentService.
     */
    public static void stop(Context context) {
        context.stopService(new Intent(context, PersistentService.class));
    }

    /**
     * Verifica si el servicio está corriendo.
     */
    public static boolean isRunning() {
        return sIsRunning;
    }
}
