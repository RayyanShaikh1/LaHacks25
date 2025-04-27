import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// Make io available to the Express app
app.set('io', io);

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Study chat: join/leave rooms
  socket.on("joinStudyChat", ({ groupId, topic }) => {
    socket.join(`studychat:${groupId}:${topic}`);
  });
  socket.on("leaveStudyChat", ({ groupId, topic }) => {
    socket.leave(`studychat:${groupId}:${topic}`);
  });

  // Group room handling
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });
  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
