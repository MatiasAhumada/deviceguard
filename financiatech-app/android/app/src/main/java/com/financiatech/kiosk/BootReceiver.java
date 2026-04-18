package com.financiatech.kiosk;

import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

/**
 * BroadcastReceiver que asegura el arranque automático de la app y sus servicios
 * después de cada reinicio del dispositivo.
 * 
 * Este receiver es crítico para garantizar que FinanciaTech siempre se ejecute
 * al iniciar el equipo, permitiendo la conexión con el servidor y el bloqueo
 * remoto incluso si el cliente nunca abre la app manualmente.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        Log.i(TAG, "========================================");
        Log.i(TAG, "BootReceiver triggered!");
        Log.i(TAG, "Action: " + action);
        Log.i(TAG, "========================================");

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_USER_PRESENT.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            Log.i(TAG, "✅ Boot action matched! Starting FinanciaTech...");
            
            // SIEMPRE iniciar el servicio guardián que reabre la app
            try {
                AppGuardianService.start(context);
                Log.i(TAG, "✅ AppGuardianService started");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to start AppGuardianService: " + e.getMessage(), e);
            }
            
            SharedPreferences prefs = context.getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
            boolean isLinked = prefs.getBoolean("isLinked", false);
            
            Log.i(TAG, "Device linked status: " + isLinked);
            
            // SIEMPRE lanzar la app al iniciar el dispositivo
            // Usar múltiples intentos con diferentes delays para máxima compatibilidad
            launchAppWithRetry(context, 3000);
            launchAppWithRetry(context, 5000);
            launchAppWithRetry(context, 8000);
            
            // Solo iniciar servicios si el dispositivo está vinculado
            if (!isLinked) {
                Log.i(TAG, "⚠️ Device not linked yet. Services will NOT start.");
                return;
            }
            
            // Dispositivo vinculado - iniciar servicios
            Log.i(TAG, "✅ Device is linked. Starting services...");
            
            // 1. Iniciar el servicio persistente guardián primero
            try {
                PersistentService.start(context);
                Log.i(TAG, "✅ PersistentService started");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to start PersistentService: " + e.getMessage(), e);
            }

            // 2. Iniciar el servicio de polling
            try {
                FinanciaTechPollingService.start(context);
                Log.i(TAG, "✅ PollingService started");
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to start PollingService: " + e.getMessage(), e);
            }

            // 3. Programar reinicio del servicio como backup
            scheduleServiceRestart(context);
        } else {
            Log.w(TAG, "⚠️ Boot action not matched: " + action);
        }
    }
    
    /**
     * Lanza la app con un delay específico.
     */
    private void launchAppWithRetry(Context context, long delayMs) {
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            try {
                Log.i(TAG, "🚀 Attempting to launch app (delay: " + delayMs + "ms)...");
                Intent launchIntent = context.getPackageManager()
                        .getLaunchIntentForPackage(context.getPackageName());
                if (launchIntent != null) {
                    launchIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_CLEAR_TOP |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    );
                    context.startActivity(launchIntent);
                    Log.i(TAG, "✅ App launch intent sent successfully (delay: " + delayMs + "ms)");
                } else {
                    Log.e(TAG, "❌ Launch intent is null (delay: " + delayMs + "ms)");
                }
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to launch app (delay: " + delayMs + "ms): " + e.getMessage(), e);
            }
        }, delayMs);
    }

    /**
     * Programa un reinicio del servicio de polling después de 10 segundos.
     * Esto actúa como mecanismo de respaldo en caso de que Android mate el servicio.
     * SOLO si el dispositivo está vinculado.
     */
    private void scheduleServiceRestart(Context context) {
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            try {
                SharedPreferences prefs = context.getSharedPreferences("FinanciaTechPrefs", Context.MODE_PRIVATE);
                boolean isLinked = prefs.getBoolean("isLinked", false);
                
                if (!isLinked) {
                    Log.d(TAG, "Device not linked, skipping service restart check");
                    return;
                }
                
                // Verificar si el servicio sigue corriendo
                boolean isServiceRunning = isServiceRunning(context, FinanciaTechPollingService.class);
                boolean isPersistentRunning = isServiceRunning(context, PersistentService.class);
                
                if (!isServiceRunning) {
                    Log.w(TAG, "PollingService not running after boot, restarting...");
                    FinanciaTechPollingService.start(context);
                }
                
                if (!isPersistentRunning) {
                    Log.w(TAG, "PersistentService not running after boot, restarting...");
                    PersistentService.start(context);
                }
                
                // Si la app está bloqueada, asegurar que se abra
                boolean isLocked = prefs.getBoolean("isLocked", false);
                
                if (isLocked) {
                    // Forzar apertura de la app
                    Intent launchIntent = context.getPackageManager()
                            .getLaunchIntentForPackage(context.getPackageName());
                    if (launchIntent != null) {
                        launchIntent.addFlags(
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED |
                            Intent.FLAG_ACTIVITY_SINGLE_TOP
                        );
                        context.startActivity(launchIntent);
                        Log.i(TAG, "App relaunched for kiosk mode");
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error in scheduled restart check: " + e.getMessage());
            }
        }, 10000); // 10 segundos
    }

    /**
     * Verifica si un servicio específico está corriendo.
     */
    private boolean isServiceRunning(Context context, Class<?> serviceClass) {
        ActivityManager manager = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (manager == null) return false;

        for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
            if (serviceClass.getName().equals(service.service.getClassName())) {
                return true;
            }
        }
        return false;
    }
}
