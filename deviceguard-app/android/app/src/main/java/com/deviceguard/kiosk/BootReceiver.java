package com.deviceguard.kiosk;

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
 * Este receiver es crítico para garantizar que DeviceGuard siempre se ejecute
 * al iniciar el equipo, permitiendo la conexión con el servidor y el bloqueo
 * remoto incluso si el cliente nunca abre la app manualmente.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        
        Log.i(TAG, "Boot broadcast received: " + action);

        // Manejar múltiples eventos de boot para máxima compatibilidad
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_USER_PRESENT.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            Log.i(TAG, "Initiating DeviceGuard startup sequence...");
            
            // 1. Iniciar el servicio persistente guardián primero
            try {
                PersistentService.start(context);
                Log.i(TAG, "PersistentService guardian started");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start persistent service: " + e.getMessage());
            }

            // 2. Iniciar el servicio de polling inmediatamente
            try {
                DeviceGuardPollingService.start(context);
                Log.i(TAG, "Polling service started successfully");
            } catch (Exception e) {
                Log.e(TAG, "Failed to start polling service: " + e.getMessage());
            }

            // 3. Lanzar la aplicación en segundo plano
            try {
                Intent launchIntent = context.getPackageManager()
                        .getLaunchIntentForPackage(context.getPackageName());
                if (launchIntent != null) {
                    launchIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK |
                        Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED |
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                    );
                    context.startActivity(launchIntent);
                    Log.i(TAG, "App launched successfully");
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch app: " + e.getMessage());
            }

            // 4. Programar reinicio del servicio como backup (Android puede matar servicios)
            scheduleServiceRestart(context);
        }
    }

    /**
     * Programa un reinicio del servicio de polling después de 10 segundos.
     * Esto actúa como mecanismo de respaldo en caso de que Android mate el servicio.
     */
    private void scheduleServiceRestart(Context context) {
        Handler handler = new Handler(Looper.getMainLooper());
        handler.postDelayed(() -> {
            try {
                // Verificar si el servicio sigue corriendo
                boolean isServiceRunning = isServiceRunning(context, DeviceGuardPollingService.class);
                boolean isPersistentRunning = isServiceRunning(context, PersistentService.class);
                
                if (!isServiceRunning) {
                    Log.w(TAG, "PollingService not running after boot, restarting...");
                    DeviceGuardPollingService.start(context);
                }
                
                if (!isPersistentRunning) {
                    Log.w(TAG, "PersistentService not running after boot, restarting...");
                    PersistentService.start(context);
                }
                
                // Si la app está bloqueada, asegurar que se abra
                SharedPreferences prefs = context.getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE);
                boolean isLocked = prefs.getBoolean("isLocked", false);
                boolean isLinked = prefs.getBoolean("isLinked", false);
                
                if (isLinked && isLocked) {
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
