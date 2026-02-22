package com.deviceguard.kiosk;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.WindowManager;
import android.provider.Settings;
import android.os.UserManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class DeviceModule extends ReactContextBaseJavaModule {
    
    private DevicePolicyManager devicePolicyManager;
    private ComponentName deviceAdmin;
    
    public DeviceModule(ReactApplicationContext reactContext) {
        super(reactContext);
        devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        deviceAdmin = new ComponentName(reactContext, DeviceAdmin.class);
    }
    
    @Override
    public String getName() {
        return "DeviceModule";
    }
    
    @ReactMethod
    public void lockDevice() {
        if (devicePolicyManager.isAdminActive(deviceAdmin)) {
            devicePolicyManager.lockNow();
        }
    }
    
    @ReactMethod
    public void startKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                String[] packages = {getReactApplicationContext().getPackageName()};
                devicePolicyManager.setLockTaskPackages(deviceAdmin, packages);
                activity.startLockTask();
                
                getReactApplicationContext().getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
                    .edit()
                    .putBoolean("isLocked", true)
                    .apply();
            } else if (devicePolicyManager.isAdminActive(deviceAdmin)) {
                activity.startLockTask();
            }
        }
    }
    
    @ReactMethod
    public void stopKioskMode() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.stopLockTask();
            if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
                devicePolicyManager.setLockTaskPackages(deviceAdmin, new String[0]);
            }
            
            getReactApplicationContext().getSharedPreferences("DeviceGuardPrefs", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("isLocked", false)
                .apply();
        }
    }
    
    @ReactMethod
    public void setStatusBarDisabled(boolean disabled) {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                if (disabled) {
                    activity.getWindow().addFlags(
                        WindowManager.LayoutParams.FLAG_FULLSCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                    );
                    activity.getWindow().getDecorView().setSystemUiVisibility(
                        android.view.View.SYSTEM_UI_FLAG_FULLSCREEN |
                        android.view.View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                        android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    );
                } else {
                    activity.getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_FULLSCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                    );
                    activity.getWindow().getDecorView().setSystemUiVisibility(0);
                }
            });
        }
    }
    
    @ReactMethod
    public void enableDeviceAdmin(Promise promise) {
        try {
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, deviceAdmin);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, 
                "DeviceGuard requiere permisos de administrador para garantizar el pago");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            getReactApplicationContext().startActivity(intent);
            promise.resolve("Device admin activation started");
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
    
    @ReactMethod
    public void isDeviceAdminActive(Promise promise) {
        boolean isActive = devicePolicyManager.isAdminActive(deviceAdmin);
        promise.resolve(isActive);
    }
    
    @ReactMethod
    public void preventUninstall() {
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            devicePolicyManager.setUninstallBlocked(deviceAdmin, 
                getReactApplicationContext().getPackageName(), true);
        }
    }
    
    @ReactMethod
    public void enableKioskRestrictions() {
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            devicePolicyManager.setUninstallBlocked(deviceAdmin, 
                getReactApplicationContext().getPackageName(), true);
            
            devicePolicyManager.setKeyguardDisabled(deviceAdmin, true);
            
            String[] packages = {getReactApplicationContext().getPackageName()};
            devicePolicyManager.setLockTaskPackages(deviceAdmin, packages);
            
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_FACTORY_RESET);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_SAFE_BOOT);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_ADD_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_REMOVE_USER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_DEBUGGING_FEATURES);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_USB_FILE_TRANSFER);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MOUNT_PHYSICAL_MEDIA);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_MODIFY_ACCOUNTS);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_WIFI);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_CONFIG_BLUETOOTH);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_NETWORK_RESET);
            devicePolicyManager.addUserRestriction(deviceAdmin, UserManager.DISALLOW_AIRPLANE_MODE);
            
            devicePolicyManager.setStatusBarDisabled(deviceAdmin, true);
            
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.STAY_ON_WHILE_PLUGGED_IN, "7");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.ADB_ENABLED, "0");
            devicePolicyManager.setGlobalSetting(deviceAdmin, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, "0");
        }
    }
    
    @ReactMethod
    public void disableSystemSettings() {
        Activity activity = getCurrentActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Settings.ACTION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                } catch (Exception e) {
                }
            });
        }
    }
}
