import http from "http";
import express from "express";
import { Server } from "socket.io";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chat-app-blond-62.vercel.app",
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  },
});

// ✅ Global socket access
app.set("io", io);

const users = {}
// jb client connect kare
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  // Room join
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room ${userId}`);
  });

  socket.on("leaveRoom", ( userId) => {
    socket.leave(userId);
  });

  // Typing show
  socket.on("typing", ({senderId , receiverId})=>{
    io.to(receiverId).emit("typing", senderId)
  })

  socket.on("stopTyping", ({senderId , receiverId})=>{
     io.to(receiverId).emit("stopTyping", senderId);
  })

  const userId = socket.handshake.query.userId
  if(userId){
    users[userId] = socket.id
  }
  io.emit("getOnlineUsers", Object.keys(users));
  console.log(users)
  

  // message emit to room
  socket.on("message", (msg)=> {
    const { receiverId } = msg;
    io.to(receiverId).emit("message", msg);
  })

  // Disconnect events
  socket.on("disconnect", () => {
    console.log("user disconnect", socket.id);
    delete users[userId]
    io.emit("getOnlineUsers", Object.keys(users));
  });

 
});

export { app, io, server };
