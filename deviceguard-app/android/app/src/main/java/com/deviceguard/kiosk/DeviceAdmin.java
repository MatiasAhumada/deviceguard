package com.deviceguard.kiosk;

import android.app.ActivityManager;
import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.ComponentName;
import android.app.admin.DevicePolicyManager;
import android.content.SharedPreferences;
import android.os.UserManager;
import android.os.Build;
import android.util.Log;

public class DeviceAdmin extends DeviceAdminReceiver {

    private static final String TAG = "DeviceAdmin";
    private static final String PREFS_NAME = "DeviceGuardPrefs";

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);

        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, DeviceAdmin.class);

        if (dpm.isDeviceOwnerApp(context.getPackageName())) {
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
            Log.i(TAG, "Device Owner enabled - Applied Factory Reset restriction.");
        }

        launchApp(context);
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();

        if ("com.deviceguard.kiosk.FORCE_RESTRICTIONS".equals(action)) {
            DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(context, DeviceAdmin.class);
            if (dpm.isDeviceOwnerApp(context.getPackageName())) {
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT);
                // Bloqueos extras antimanipulación (cuentas y configuraciones)
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER);
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_REMOVE_USER);
                Log.i(TAG, "Forced permanent restrictions via Intent!");
            }
            return;
        }

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_USER_PRESENT.equals(action)) {

            DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(context, DeviceAdmin.class);

            if (!dpm.isAdminActive(adminComponent)) return;

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean isLinked = prefs.getBoolean(DeviceGuardPollingService.KEY_IS_LINKED, false);
            boolean isLocked = prefs.getBoolean(DeviceGuardPollingService.KEY_IS_LOCKED, false);

            Log.i(TAG, "Boot received — isLinked=" + isLinked + " isLocked=" + isLocked);

            if (isLinked) {
                // Siempre arrancar el polling service si el dispositivo está vinculado
                DeviceGuardPollingService.start(context);

                // Si estaba bloqueado, deshabilitar keyguard y lanzar la app en kiosk
                if (isLocked && dpm.isDeviceOwnerApp(context.getPackageName())) {
                    dpm.setKeyguardDisabled(adminComponent, true);

                    // Configurar lock task packages
                    try {
                        String[] packages = {context.getPackageName()};
                        dpm.setLockTaskPackages(adminComponent, packages);
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                            dpm.setLockTaskFeatures(adminComponent,
                                    DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error configuring lock task on boot: " + e.getMessage());
                    }
                }

                // Abrir la app (el polling service + la pantalla resolverán el estado)
                launchApp(context);
            } else if (dpm.isDeviceOwnerApp(context.getPackageName())) {
                // Si la app es dueña del dispositivo pero aún no está vinculada (o perdió la info
                // tras la actualización), levantamos la app sí o sí para que haga el auto-check
                // contra el servidor usando el IMEI.
                Log.i(TAG, "Device Owner active but not linked yet. Launching app to provision.");
                launchApp(context);
            }
        }
    }

    /**
     * Inicia el modo Kiosk (Lock Task) para bloquear el dispositivo en la app.
     * Esto previene que el usuario pueda cerrar la app, acceder a home, recent apps,
     * notificaciones, o cualquier otra función del sistema.
     * 
     * @param context Debe ser una instancia de Activity o tener FLAG_ACTIVITY_NEW_TASK
     */
    public static void startKioskMode(Context context) {
        DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(context, DeviceAdmin.class);

        if (dpm == null || !dpm.isDeviceOwnerApp(context.getPackageName())) {
            Log.w(TAG, "Cannot start kiosk mode: not device owner");
            return;
        }

        try {
            // Configurar los paquetes permitidos en lock task mode
            String[] packages = {context.getPackageName()};
            dpm.setLockTaskPackages(adminComponent, packages);

            // Configurar features de lock task (none = más restrictivo)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                dpm.setLockTaskFeatures(adminComponent,
                        DevicePolicyManager.LOCK_TASK_FEATURE_NONE);
            }

            // Guardar estado en SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean("isFullLockdownActive", true).apply();

            Log.i(TAG, "Kiosk mode configured via DevicePolicyManager");

        } catch (Exception e) {
            Log.e(TAG, "Error configuring kiosk mode: " + e.getMessage(), e);
        }
    }

    /**
     * Verifica si el Lock Task Mode está activo.
     */
    public static boolean isKioskActive(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ActivityManager am = (ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
            if (am != null) {
                return am.isInLockTaskMode();
            }
        }
        return false;
    }

    /**
     * Detiene el modo Kiosk (Lock Task) para permitir navegación normal.
     */
    public static void stopKioskMode(Context context) {
        try {
            // Actualizar estado en SharedPreferences
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean("isFullLockdownActive", false).apply();

            Log.i(TAG, "Kiosk mode stopped");

        } catch (Exception e) {
            Log.e(TAG, "Error stopping kiosk mode: " + e.getMessage(), e);
        }
    }

    private void launchApp(Context context) {
        Intent launchIntent = context.getPackageManager()
                .getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(launchIntent);
        }
    }
}
