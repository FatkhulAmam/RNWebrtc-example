const express = require('express')
const app = express()
const server = require("http").Server(app)

const USE_PORT = 5050

const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
})

io.on("connection", (socket)=>{
  console.log('Connect on id :' + socket.id);

  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on("offering", payload => {
      io.to(payload.target).emit("offer-data", payload)
  })

  socket.on('answer', payload => {
    io.to(payload.target).emit('answer-call', payload);
  });
  
  socket.on('ice-candidate', incoming => {
      io.to(incoming.target).emit('ice-candidate', incoming.candidate)
  })

  socket.on('disconnect', () => {
    console.log('disconnect')
  });
})

server.listen(USE_PORT, ()=> {
    console.log(`videoCall-server running on ${USE_PORT}`)
})