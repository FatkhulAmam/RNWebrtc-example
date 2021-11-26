package com.reactnativevideocall.incomingCall;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

import com.facebook.react.bridge.ReactContext;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import com.reactnativevideocall.R;

public class IncomingCallNotificationBuilder {
    private static final String NOTIFICATION_CHANNEL_ID = "INCOMING_CALL_NOTIFICATION_CHANNEL_ID";
    private final Context context;
    final long[] vibrationPattern = {1000, 1000};
    private Uri soundUri;
    public ReactContext reactContext;

    public IncomingCallNotificationBuilder(Context context) {
        this.context = context;

        PowerManager pm = (PowerManager)context.getSystemService(Context.POWER_SERVICE);
        boolean isScreenOn = pm.isInteractive();
        if (!isScreenOn){
            PowerManager.WakeLock wl = pm.newWakeLock( PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "App:IncomingCall");
            wl.acquire(5000);
        }

        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q) {
            soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/" + R.raw.incoming_call_ringtone);
            Ringtone ringtone = RingtoneManager.getRingtone(context.getApplicationContext(), soundUri);
            ringtone.play();
        };
        createNotificationChannel();
    }

    public int createID(){
        Date now = new Date();
        int id = Integer.parseInt(new SimpleDateFormat("ddHHmmss", Locale.ENGLISH).format(now));
        return id;
    }

    private void createNotificationChannel(){
        final NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1){
            final NotificationChannel notificationChannel = new NotificationChannel(NOTIFICATION_CHANNEL_ID, "Appel entrant", NotificationManager.IMPORTANCE_HIGH);
            notificationChannel.setDescription("Incoming Call Notification For Callink");
            notificationChannel.setVibrationPattern(vibrationPattern);
            notificationChannel.enableVibration(true);
            notificationChannel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                notificationChannel.setSound(Settings.System.DEFAULT_RINGTONE_URI,new  AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build());
            };
            notificationManager.createNotificationChannel(notificationChannel);
        }
    }

    public Notification build(String title, String subTitle, String avatarUrl){
        final Intent incomingCallIntent = new Intent(context, IncomingCallActivity.class);
        Bundle bundle = new Bundle();
        bundle.putString("username", title);
        bundle.putString("appTitle", subTitle);
        bundle.putString("avatarUrl", avatarUrl);
        incomingCallIntent.putExtras(bundle);
        final PendingIntent incomingCallPendingIntent = PendingIntent.getActivity(context.getApplicationContext(), createID(), incomingCallIntent, PendingIntent.FLAG_ONE_SHOT);
        final Notification notification = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.drawable.logo)
                .setColor(Color.argb(0,239, 247, 255))
                .setColorized(true)
                .setOngoing(true)
                .setWhen(System.currentTimeMillis()*2)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(incomingCallPendingIntent)
                .setFullScreenIntent(incomingCallPendingIntent, true)
                .setVibrate(vibrationPattern)
                .setDefaults(NotificationCompat.DEFAULT_LIGHTS)
                .setCustomContentView(getIncomingCallNotificationView(title, subTitle))
                .build();
        notification.flags = Notification.FLAG_ONGOING_EVENT | Notification.FLAG_NO_CLEAR;

        return notification;
    }

    private RemoteViews getIncomingCallNotificationView(String title, String subTitle){
        final RemoteViews remoteIncomingCall = new RemoteViews(context.getPackageName(), R.layout.notification_incoming_call);
        final Intent answerCallIntent = new Intent(HangUpReceiver.ACTION_INCOMING_ANSWERED_CALL);
        final Intent hangUpIntent = new Intent(HangUpReceiver.ACTION_INCOMING_REJECT_CALL);
        hangUpIntent.setAction(HangUpReceiver.ACTION_INCOMING_REJECT_CALL);
        final PendingIntent hangUpPendingIntent = PendingIntent.getBroadcast(
                context,
                createID(),
                hangUpIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
        );
        final PendingIntent answerCallPendingIntent = PendingIntent.getBroadcast(
                context,
                createID(),
                answerCallIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
        );
        remoteIncomingCall.setTextViewText(R.id.incoming_call_title, title);
        remoteIncomingCall.setTextViewText(R.id.incoming_call_notification_content_text, subTitle);
        remoteIncomingCall.setOnClickPendingIntent(R.id.answer_call_button, answerCallPendingIntent);
        remoteIncomingCall.setOnClickPendingIntent(R.id.hang_up_button, hangUpPendingIntent);
        return remoteIncomingCall;
    }

}
