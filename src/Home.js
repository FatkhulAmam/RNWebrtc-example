import React, {Component, createRef} from 'react';
import {
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import io from 'socket.io-client';

const socket = io.connect('http://172.10.100.13:5050');

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      myName: '',
      partnerName: '',
      modalVisivble: false,
    };
    this.socketRef = createRef();
  }

  componentDidMount() {
    this.socketRef.current = socket;
    console.log(this.socketRef.current);
    this.setState({modalVisible: true});
  }

  onBackModal = () => {
    if (this.state.myName === '') {
      ToastAndroid.showWithGravity(
        'The Name Cannot empty',
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
      );
    } else {
      this.setState({modalVisible: false});
    }
  };

  render() {
    const data = {
      partner: this.state.partnerName,
      me: this.state.myName,
    };
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{color: '#000', fontWeight: 'bold'}}>
          Hallo {this.state.myName}
        </Text>
        <Text>Do you want make a call ?</Text>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            placeholder="partner name"
            onChangeText={e => this.setState({partnerName: e})}
            style={{borderBottomWidth: 1, width: 250}}
          />
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate('CallingView', data)}
            style={{
              marginLeft: 10,
              backgroundColor: '#77bb00',
              padding: 10,
              justifyContent: 'center',
              alignItems: 'center',
              width: 75,
              borderRadius: 20,
            }}>
            <Text style={{color: '#fff'}}>Call</Text>
          </TouchableOpacity>
        </View>
        <Modal
          animationOut="fadeOut"
          animationIn="fadeIn"
          animationOutTiming={500}
          animationInTiming={500}
          isVisible={this.state.modalVisible}
          onBackdropPress={this.onBackModal}
          style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
          <View
            style={{
              backgroundColor: '#fff',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 10,
              padding: 20,
            }}>
            <Text style={{fontSize: 20, color: '#000', fontWeight: 'bold'}}>
              You Called As:
            </Text>
            <TextInput
              placeholder="enter your name"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: '#8e8e8e',
                width: '75%',
              }}
              onChangeText={name => {
                this.setState({myName: name});
              }}
            />
            <TouchableOpacity
              onPress={this.onBackModal}
              style={{
                backgroundColor: '#77bb00',
                alignSelf: 'flex-end',
                marginTop: 20,
                padding: 7,
                borderRadius: 10,
              }}>
              <Text style={{color: '#fff'}}>SetName</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    );
  }
}
