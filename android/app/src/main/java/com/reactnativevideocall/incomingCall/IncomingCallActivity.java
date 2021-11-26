package com.reactnativevideocall.incomingCall;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.RequiresApi;

import com.squareup.picasso.Picasso;

import com.reactnativevideocall.R;

public class IncomingCallActivity extends FullScreenActivity {

    private ImageView ivAvatar;

    @RequiresApi(api = Build.VERSION_CODES.R)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_incoming_call);

        Bundle bundle = getIntent().getExtras();
        String username = bundle.getString("username");
        String appTitle = bundle.getString("appTitle");
        String avatarUrl = bundle.getString("avatarUrl");

        ivAvatar = findViewById(R.id.activity_caller_photo);
        Picasso.get().load(avatarUrl).transform(new CircleTransform()).into(ivAvatar);
        TextView incomingTitle = (TextView) findViewById(R.id.incoming_call_title);
        incomingTitle.setText(appTitle);
        TextView incomingName = (TextView) findViewById(R.id.caller_name);
        incomingName.setText(username);

        findViewById(R.id.activity_answer_call_button).setOnClickListener(__ -> {
            sendBroadcast(new Intent(HangUpReceiver.ACTION_INCOMING_ANSWERED_CALL));
            finish();
        });
        findViewById(R.id.activity_hang_up_button).setOnClickListener(__ -> {
            sendBroadcast(new Intent(HangUpReceiver.ACTION_INCOMING_REJECT_CALL));
            finish();
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }
}