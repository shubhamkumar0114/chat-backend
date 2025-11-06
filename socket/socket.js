import http from "http";
import express from "express";
import { Server } from "socket.io";
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: " http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ✅ Global socket access
app.set("io", io);

let onlineUsers = new Map(); // userId -> socketId
// jb client connect kare
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  // listen event from client
  socket.on("message", (msg) => {
    console.log("message recived ", msg);

    // sabhi clients bhej do
    io.emit("message", msg);
  });

  // 🔹 user online aaya
  socket.on("user-online", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("get-online-users", Array.from(onlineUsers.keys()));
  });

  // 🔹 user disconnect hua
  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("get-online-users", Array.from(onlineUsers.keys()));
    console.log("User disconnected:", socket.id);
  });

  // Disconnect events
  socket.on("disconnect", () => {
    console.log("user disconnect", socket.id);
  });
});

export { app, io, server };
