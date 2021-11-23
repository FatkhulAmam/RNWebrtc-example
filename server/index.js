const express = require('express');
const app = express();
const server = require('http').Server(app);

const USE_PORT = 5050;

const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const room = {};
io.on('connection', socket => {
  console.log("connection id:",socket.id);

  socket.on('enter room', index => {
    //   socket.emit('room name', roomID);
    console.log('me: ', index);
    if (room[index]) {
      room[index].push(socket.id);
    } else {
      room[index] = [socket.id];
    }

    console.log('partner in room', room[index]);
    // const otherUser = room[index].find(id => {
    //   return id;
    // });

    // console.log("other", otherUser)
    //   if (otherUser) {
    // socket.emit('other user', otherUser);
    //     socket.to(otherUser).emit('user joined', socket.id);
    //     // console.log(`otherUser: ${(roomID, room, otherUser, socket.id)}`);
    //   }
  });

  socket.emit('other user', room)

  // socket.on('other user', otherUser => {
  //   const other = room[otherUser].find(id => {return id})
  // });

  socket.on('offering', payload => {
    console.log('OFFER: ', payload.partnerName);
    // const otherUser = room[payload.partnerName].find(id => {
    //   return id;
    // });

    // console.log('senggol dong:', otherUser);
    // socket.emit('partner id', otherUser);
    io.to(payload.target).emit('offer-data', {payload, room});
  });

  socket.on('answer', payload => {
    // console.log('ANSWER: ', payload);
    io.to(payload.target).emit('answer-call', payload);
  });

  socket.on('reject', payload => {
    // console.log('REJECT: ', payload);
    io.to(payload.target).emit('reject-index', payload);
  });

  socket.on('ending', payload => {
    // console.log('ENDING: ', payload);
    io.to(payload.target).emit('end-index', payload);
  });

  socket.on('ice-candidate', incoming => {
    // console.log('ICE: ', incoming);
    io.to(incoming.target).emit('ice-candidate', incoming.candidate);
  });

  socket.on('disconnect', () => {
    console.log('disconnect');
  });
});

server.listen(USE_PORT, () => {
  console.log(`videoCall-server running on ${USE_PORT}`);
});
