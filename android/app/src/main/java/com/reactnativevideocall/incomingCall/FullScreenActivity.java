package com.reactnativevideocall.incomingCall;

import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.accessibility.AccessibilityEventCompat;

public class FullScreenActivity extends AppCompatActivity {
    KeyguardManager.KeyguardLock kl;

    @RequiresApi(api = Build.VERSION_CODES.R)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setTurnScreenOn(true);
            setShowWhenLocked(true);

            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            kl= keyguardManager.newKeyguardLock("IN");
            kl.disableKeyguard();
            keyguardManager.requestDismissKeyguard(this, null);
        } else {
           getWindow().addFlags(
                   WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                   WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                           WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                           WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                           AccessibilityEventCompat.TYPE_WINDOWS_CHANGED
           );
        }
        hideNavigationBarForOldAPIs();
    }

    // @RequiresApi(api = Build.VERSION_CODES.R)
    // public void hideNavigationBar(){
    //     if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
    //         getWindow().setDecorFitsSystemWindows(false);
    //         getWindow().getDecorView().getWindowInsetsController().hide(WindowInsets.Type.navigationBars());
    //         getWindow().getDecorView().getWindowInsetsController().
    //                 setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    //     } else hideNavigationBarForOldAPIs();
    // }

    public void hideNavigationBarForOldAPIs() {
        int visibilityOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            visibilityOptions |= View.SYSTEM_UI_FLAG_IMMERSIVE;
        }
        getWindow().getDecorView().setSystemUiVisibility(visibilityOptions);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1)
            hideNavigationBarForOldAPIs();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}
