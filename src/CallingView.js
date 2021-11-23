import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Dimensions,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  ScrollView,
} from 'react-native';
import io from 'socket.io-client';
import {
  mediaDevices,
  RTCView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import Clipboard from '@react-native-clipboard/clipboard';
import uuid from 'react-native-uuid';
// import InCallManager from 'react-native-incall-manager';

const socket = io.connect('http://172.10.100.13:5050');
const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
const peer = new RTCPeerConnection(configuration);
const {width, height} = Dimensions.get('window');

const initialParser = {
  isCalling: false,
  isAnswer: false,
  isReject: false,
  isEnd: false,
};

const string = 'name';

const App = props => {
  const [rName, setRnamed] = useState('');
  const [myId, setMyId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [myName, setMyName] = useState('');
  const [partnerVideo, setPartnerVideo] = useState(null);
  const [userVideo, setUserVideo] = useState(null);
  const [partnerName, setPartnerName] = useState('');

  // set data from socket
  const [offerData, setOfferData] = useState(null);
  const [indexIncom, setIndexIncom] = useState(false);

  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const userStream = useRef();

  useEffect(() => {
    const {params} = props.route;
    console.log('NAMEE:', props);
    otherUser.current = partnerId;

    socketRef.current = socket;
    console.log(socketRef.current.id);
    setMyId(socketRef.current.id);
    socketRef.current.emit('enter room', {
      me: params.me,
      partner: params.partner,
    });
    socketRef.current.on('other user', value => console.log('OTHER', value));
    socketRef.current.on('room name', value => {
      setRnamed(value);
      console.log('value:', value);
    });
    socketRef.current.on('offer-data', value => {
      console.log('offering', value.payload.index.isCalling);
      setOfferData(value.payload);
      setIndexIncom(value.payload.index.isCalling);
    });
    socketRef.current.on('answer-call', handleAnswerCall);
    socketRef.current.on('end-index', value => {
      // indexIncom(!value.index.isEnd)
      setPartnerVideo(null);
      console.log('ended', value);
    });
    socketRef.current.on('reject-data', value => {
      console.log(value);
    });
    socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
    socketRef.current.on('disconnect', () => {
      console.log('socket disconnect');
    });

    let isFront = true;
    mediaDevices.enumerateDevices().then(mediaInfos => {
      let videoSourceId;
      for (let i = 0; i < mediaInfos.length; i++) {
        const mediaInfo = mediaInfos[i];
        if (
          mediaInfo.kind === 'videoinput' &&
          mediaInfo.facing == (isFront ? 'environment' : 'environment')
        ) {
          videoSourceId = mediaInfo.deviceId;
        }
      }
      mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: width,
            height: height,
            frameRate: 30,
            facingMode: isFront ? 'environment' : 'environment',
            deviceId: videoSourceId,
          },
        })
        .then(iStream => {
          setUserVideo(iStream);
          userStream.current = iStream;
        })
        .catch(error => {
          console.log('err', error);
        });
    });
  }, []);

  const copyToClipboard = () => {
    Clipboard.setString(myId);
    showToast();
  };

  const showToast = () => {
    ToastAndroid.showWithGravity(
      'Copied Id To Clipboard',
      ToastAndroid.LONG,
      ToastAndroid.BOTTOM,
    );
  };

  const callUser = () => {
    peerRef.current = createPeer();
    console.log('STATE: ', peerRef.current.signalingState);
    if (peerRef.current) {
      peerRef.current.addStream(userVideo);
      userStream.current.getTracks().forEach(track => {
        peerRef.current.addStream(track, userStream.current);
      });
    }

    peerRef.current
      .createOffer()
      .then(offer => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          roomName: partnerName,
          target: partnerId,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
          index: {...initialParser, isCalling: true},
        };
        socketRef.current.emit('offering', payload);
      })
      .catch(e => console.log(e));
  };

  function createPeer() {
    peer.onicecandidate = handleICECandidateEvent;
    peer.onaddstream = function (e) {
      console.log('on add stream');
      if (e.stream && partnerVideo !== e.stream) {
        console.log('RemotePC received the stream', e.stream);
        setPartnerVideo(e.stream);
      }
    };
    return peer;
  }

  const handleNewICECandidateMsg = incoming => {
    const candidate = new RTCIceCandidate(incoming);
    peerRef.current.addIceCandidate(candidate);
  };

  function handleICECandidateEvent(e) {
    console.log('handleICECandidateEvent');
    if (e.candidate) {
      console.log('e.candidate', e.candidate.candidate);
      const payload = {
        target: partnerId || offerData.caller,
        candidate: e.candidate,
      };
      socketRef.current.emit('ice-candidate', payload);
    }
  }

  const handleReceiveCall = data => {
    setIndexIncom(false);
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
  };

  const handleAnswerCall = msg => {
    console.log('ANSWER', msg);
    const desc = new RTCSessionDescription(msg.sdp);
    console.log('PAERTNER VIDEO', partnerVideo);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {
        peerRef.current.addStream(myId);
      })
      .catch(e => console.log(e));
  };

  const handleEndCall = () => {
    peerRef.current = createPeer();
    peerRef.current.close();
    // peerRef.current = createPeer()
    // console.log("STATE: ", peerRef.current.signalingState)
    // partnerVideo.getTracks().forEach(element => {
    //   element.stop()
    // });
    socketRef.current.emit('ending', {
      target: partnerId || offerData.caller,
      index: {...initialParser, isEnd: true},
    });
    setPartnerVideo(null);
    // socket.on("disconnect", () => {
    //   console.log(socket.id); // undefined
    // });
    // socketRef.current = socket
    // socketRef.current.on('connect', ()=>{
    //   setMyId(socket.id)
    // })
  };

  const handleRejectCall = () => {
    socketRef.current.emit('reject', {
      target: partnerId || offerData.caller,
      index: {...initialParser, isReject: true},
    });
  };

  partnerVideo && console.log('PARTNER VIDEO:', partnerVideo);
  userVideo && console.log('USER VIDEO:', userVideo);

  return indexIncom === false ? (
    <ScrollView>
      <View>
        {partnerVideo !== null ? (
          <RTCView
            streamURL={partnerVideo?.toURL()}
            style={styles.partnerVideo}
            objectFit={'cover'}
            mirror={true}
          />
        ) : null}
      </View>
      <RTCView
        streamURL={userVideo?.toURL()}
        style={styles.ourVideo}
        mirror={true}
      />
      <View style={styles.wraperup}>
        <TextInput
          value={props.route.params}
          placeholder="My Name"
          style={styles.myName}
          onChangeText={me => setMyName(me)}
        />
        <Text style={{color: '#000'}}>My Id: {myId}</Text>
        <TouchableOpacity style={styles.myId} onPress={copyToClipboard}>
          <Text style={{color: '#fff'}}>Copy Me Id</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.wraperDown}>
        <TextInput
          placeholder="Id To Call"
          style={styles.idToCall}
          onChangeText={idPartner => setPartnerId(idPartner)}
        />
        {partnerVideo !== null ? (
          <TouchableOpacity
            style={[styles.wrapCall, {backgroundColor: '#ff0000'}]}
            onPress={() => handleEndCall()}>
            <Text style={{color: '#fff'}}>END</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.wrapCall, {backgroundColor: '#77bb00'}]}
            onPress={() => callUser()}>
            <Text style={{color: '#fff'}}>CALL</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  ) : (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{color: '#000'}}>incoming...</Text>
      <View style={{flexDirection: 'row'}}>
        <TouchableOpacity
          onPress={() => handleReceiveCall(offerData)}
          style={{
            width: 150,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#77bb00',
            borderRadius: 10,
            margin: 10,
          }}>
          <Text style={{color: '#fff'}}>Answer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectCall()}
          style={{
            width: 150,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ff0000',
            borderRadius: 10,
            margin: 10,
          }}>
          <Text style={{color: '#fff'}}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  partnerVideo: {width, height: height, backgroundColor: '#3ed914'},
  ourVideo: {width: 100, height: 100, margin: 25},
  wraperup: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 25,
  },
  myName: {
    borderColor: '#737373',
    borderWidth: 1,
    width: width - 20,
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  myId: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3ed914',
    width: width - 20,
    padding: 12,
    borderRadius: 20,
    margin: 10,
  },
  wraperDown: {flexDirection: 'row', marginHorizontal: 10},
  idToCall: {
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    width: width / 1.5,
    marginRight: 10,
  },
  wrapCall: {
    backgroundColor: '#8e8e8e',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    width: 100,
  },
});
