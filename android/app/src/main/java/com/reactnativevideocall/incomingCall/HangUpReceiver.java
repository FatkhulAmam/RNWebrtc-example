package com.reactnativevideocall.incomingCall;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;


public class HangUpReceiver extends BroadcastReceiver {

    public static final String ACTION_INCOMING_REJECT_CALL =
            "chat.callink.reactnative" + "ACTION_INCOMING_REJECT_CALL";
    public static final String ACTION_INCOMING_ANSWERED_CALL =
            "chat.callink.reactnative" + "ACTION_INCOMING_ANSWERED_CALL";

    private IncomingCallHangUpHandler incomingCallHangUpHandler;
    private AnsweredCallHangUpHandler answeredCallHangUpHandler;

    public interface IncomingCallHangUpHandler{
        void handle();
    }

    public interface AnsweredCallHangUpHandler{
        void handle();
    }

    public void setIncomingCallHangUpHandler(IncomingCallHangUpHandler incomingCallHangUpHandler) {
        this.incomingCallHangUpHandler = incomingCallHangUpHandler;
    }

    public void setAnsweredCallHangUpHandler(AnsweredCallHangUpHandler answeredCallHangUpHandler) {
        this.answeredCallHangUpHandler = answeredCallHangUpHandler;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        assert incomingCallHangUpHandler != null && answeredCallHangUpHandler != null;
        if(intent.getAction().equals(ACTION_INCOMING_REJECT_CALL)){
            incomingCallHangUpHandler.handle();
        }else if (intent.getAction().equals(ACTION_INCOMING_ANSWERED_CALL)){
            answeredCallHangUpHandler.handle();
        }
    }
}