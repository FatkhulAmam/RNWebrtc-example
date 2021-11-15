import React, {useEffect, useRef, useState} from 'react'
import { View, Text, Dimensions, TextInput, TouchableOpacity, StyleSheet, ToastAndroid, ScrollView } from 'react-native'
import io, { connect } from 'socket.io-client'
import { mediaDevices, RTCView, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc'
import Clipboard from '@react-native-clipboard/clipboard';
import InCallManager from 'react-native-incall-manager';

const socket = io.connect('http://172.10.100.9:5050')
const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
const {width, height} = Dimensions.get('window')

const initialParser = {
  isCalling: false,
  isAnswer: false,
  isReject: false
}

const App = () => {
  const [myId, setMyId] = useState('')
  const [partnerId, setPartnerId] = useState('')
  const [myName, setMyName] = useState('')
  const [partnerVideo, setPartnerVideo] = useState(null)
  const [userVideo, setUserVideo] = useState(null)

  // njajal
  const [indexCall, setIndexCall] = useState()
  const [indexAnswer, setIndexAnswer] = useState()

  const peerRef = useRef()
  const socketRef = useRef()
  const otherUser= useRef()
  const userStream = useRef()

  useEffect(() => {
    otherUser.current = partnerId

    socketRef.current = socket
    socketRef.current.on('connect', ()=>{
      setMyId(socket.id)
    })
    socketRef.current.on('offer-data', handleReceiveCall);
    socketRef.current.on('answer-call', handleAnswerCall);
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);

    let isFront = true;
    mediaDevices.enumerateDevices().then(mediaInfos => {
      let videoSourceId;
      for (let i = 0; i < mediaInfos.length; i++){
        const mediaInfo = mediaInfos[i];
        if (mediaInfo.kind == "videoinput" && mediaInfo.facing == (isFront ? "front" : "environment")) {
          videoSourceId = mediaInfo.deviceId;
        }
      }
      mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: width,
          height: height,
          frameRate: 30,
          facingMode: (isFront ? "user" : "environment"),
          deviceId: videoSourceId
        }
      }).then(iStream => {
        setUserVideo(iStream)
        userStream.current = iStream
      }).catch(error => {
        console.log("err", error)
      })
    })
  },[])

  const copyToClipboard = () => {
    Clipboard.setString(myId)
    showToast()
  }

  const showToast = () => {
    ToastAndroid.showWithGravity(
      "Copied Id To Clipboard",
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM
    )
  }

  const callUser = () => {
    peerRef.current = createPeer()
    if (peerRef.current) {
      peerRef.current.addStream(userVideo)
      userStream.current.getTracks().forEach(track => {
        peerRef.current.addStream(track, userStream.current)
      });
    }

    peerRef.current
      .createOffer()
      .then(offer => {
        return peerRef.current.setLocalDescription(offer)
      })
      .then(() => {
        const payload = {
          target: partnerId,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription
        }
        socketRef.current.emit('offering', payload)
      })
  }

  const createPeer = () => {
    const peer = new RTCPeerConnection(configuration)

    peer.onicecandidate = e => {
      if (e.candidate) {
        const payload = {
          target: partnerId,
          candidate: e.candidate,
        };
        socketRef.current.emit('ice-candidate', payload);
      }
    };
  
    peer.onaddstream = function(e){
      if (e.stream && partnerVideo !== 0) {
        setPartnerVideo(e.stream)
        try {
          InCallManager.start({media: ''});
          InCallManager.setForceSpeakerphoneOn(true);
          InCallManager.setSpeakerphoneOn(true);
        } catch (err) {
          console.log('InApp Caller ---------------------->', err);
        }
      }
    }
    return peer
  }

  const handleNewICECandidateMsg = (incoming) => {
    const candidate = new RTCIceCandidate(incoming)
    peerRef.current.addIceCandidate(candidate)
  }

  const handleReceiveCall = (data) => {
    peerRef.current = createPeer();
    const desc = new RTCSessionDescription(data.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {
        peerRef.current.addStream(userStream.current);
        userStream.current
          .getTracks()
          .forEach(track =>
            peerRef.current.addStream(track, userStream.current),
          );
      })
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then(answer => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          target: data.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit('answer', payload);
      });
  }

  const handleAnswerCall = (msg) => {
    console.log("ANSWER", msg)
    const desc = new RTCSessionDescription(msg.sdp);
    console.log("PAERTNER VIDEO", partnerVideo)
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {
        peerRef.current.addStream(myId);
      })
      .catch(e => console.log(e));
  }



  partnerVideo && console.log('PARTNER VIDEO:', partnerVideo);
  userVideo && console.log('USER VIDEO:', userVideo);

  return (
    <ScrollView>
      <View>
        {partnerVideo !== null ? (
        <RTCView streamURL={partnerVideo?.toURL()} style={styles.partnerVideo} objectFit={'cover'}/>
        ) : null}
      </View>
      <RTCView streamURL={userVideo?.toURL()} style={styles.ourVideo}/>
          {indexCall === true ? (
            <View>
              <TouchableOpacity>
              <Text>Answer Call</Text>
              </TouchableOpacity>
            </View>
          ): (
            <>
      <View style={styles.wraperup}>
        {indexAnswer ? (
          <View>
            <Text>User Answered The Call</Text>
          </View>
        ): null }
        <TextInput
          placeholder="My Name" style={styles.myName}
          onChangeText={me => setMyName(me)}
        />
        <Text style={{color: '#000'}}>My Id: {myId}</Text>
        <TouchableOpacity style={styles.myId} onPress={copyToClipboard}>
          <Text style={{color: '#fff'}}>Copy Me Id</Text>
        </TouchableOpacity>
      </View>
        <View style={styles.wraperDown}>
          <TextInput
            placeholder="Id To Call" style={styles.idToCall}
            onChangeText={idPartner => setPartnerId(idPartner)}
          />
          <TouchableOpacity style={styles.wrapCall} onPress={()=>callUser()}>
            <Text style={{color: '#fff'}}>CALL</Text>
          </TouchableOpacity>
          </View>
        </>
          )}
    </ScrollView>
  )
}

export default App

const styles = StyleSheet.create({
  partnerVideo: {width, height: height-250,backgroundColor: '#3ed914'},
  ourVideo: {width: 100, height: 100, margin: 25},
  wraperup: {justifyContent: 'center', alignItems: 'center', marginHorizontal: 10, marginTop: 25},
  myName: {borderColor: '#737373', borderWidth: 1, width: width - 20, borderRadius: 20, paddingHorizontal: 15},
  myId: {justifyContent: 'center', alignItems: 'center', backgroundColor: '#3ed914', width: width - 20, padding: 12, borderRadius: 20, margin: 10},
  wraperDown: {flexDirection: 'row', marginHorizontal: 10},
  idToCall: {borderBottomColor: '#000', borderBottomWidth: 1, width: width/1.5, marginRight: 10},
  wrapCall: {backgroundColor: '#8e8e8e', padding: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 10, width: 100}
})
