package com.reactnativevideocall.incomingCall;

import android.content.IntentFilter;
import android.os.Handler;

import androidx.core.app.NotificationManagerCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.reactnativevideocall.R;

public class IncomingCallModule extends ReactContextBaseJavaModule {

    private NotificationManagerCompat notificationManagerCompat;
    private final HangUpReceiver hangUpReceiver = new HangUpReceiver();
    private IncomingCallNotificationBuilder incomingCallNotificationBuilder;
    public static ReactApplicationContext reactContext;

    public IncomingCallModule(ReactApplicationContext context){
        super(context);
        IntentFilter hangUpBroadcastFilter = new IntentFilter();
        hangUpBroadcastFilter.addAction(HangUpReceiver.ACTION_INCOMING_REJECT_CALL);
        hangUpBroadcastFilter.addAction(HangUpReceiver.ACTION_INCOMING_ANSWERED_CALL);
        context.registerReceiver(hangUpReceiver, hangUpBroadcastFilter);
        reactContext = context;
    }

    @Override
    public String getName() {
        return "IncomingCall";
    }

    @ReactMethod
    public void getIncomingCall(String title, String subTitle, String avatar) {
        hangUpReceiver.setAnsweredCallHangUpHandler(this::handleIncomingCallAnswered);
        hangUpReceiver.setIncomingCallHangUpHandler(this::handleIncomingCallReject);
        incomingCallNotificationBuilder = new IncomingCallNotificationBuilder(getReactApplicationContext());
        notificationManagerCompat = NotificationManagerCompat.from(getCurrentActivity());
        new Handler().postDelayed(() -> sendNotification(title, subTitle, avatar), 2000);
    }

    private void handleIncomingCallAnswered() {
        sendEvent("AnswerCall", "true");
        cancelNotification();
    }

    private void handleIncomingCallReject() {
        sendEvent("HangUp", "false");
        cancelNotification();
    }

    private void sendNotification(String title, String subTitle, String avatarUrl) {
        notificationManagerCompat.notify(R.integer.incoming_call_notification_id, incomingCallNotificationBuilder.build(title, subTitle, avatarUrl));
    }

    private void cancelNotification() {
        notificationManagerCompat.cancel(R.integer.incoming_call_notification_id);
    }

    public void sendEvent(String eventName, String eventMessage){
       boolean isBoundToJs = this.getReactApplicationContext().hasActiveCatalystInstance();
        WritableMap params = Arguments.createMap();
        params.putString(eventName, eventMessage);
       if (isBoundToJs && reactContext != null){
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(eventName, params);
       }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
    }
}
