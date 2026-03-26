package com.financiatech.kiosk;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Handler;
import android.content.SharedPreferences;

public class ConnectivityWatchdog extends Service {
    
    private static final String PREFS_NAME = "FinanciaTechPrefs";
    private static final String KEY_UNLOCK_CODE = "unlockCode";
    private static final long CHECK_INTERVAL = 30000;
    
    private Handler handler = new Handler();
    private Runnable checkTask = new Runnable() {
        @Override
        public void run() {
            checkConnectivity();
            handler.postDelayed(this, CHECK_INTERVAL);
        }
    };
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handler.post(checkTask);
        return START_STICKY;
    }
    
    private void checkConnectivity() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        
        if (activeNetwork == null || !activeNetwork.isConnected()) {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String unlockCode = prefs.getString(KEY_UNLOCK_CODE, null);
            
            if (unlockCode != null) {
                Intent unlockIntent = new Intent(this, MainActivity.class);
                unlockIntent.putExtra("offlineUnlock", true);
                unlockIntent.putExtra("unlockCode", unlockCode);
                unlockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(unlockIntent);
                
                prefs.edit().remove(KEY_UNLOCK_CODE).apply();
            }
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
    
    @Override
    public void onDestroy() {
        handler.removeCallbacks(checkTask);
        super.onDestroy();
    }
}
