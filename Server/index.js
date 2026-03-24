import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Server running ✅" });
});

const PORT = process.env.PORT || 5000;

export let io;

export function getIO() {
  return io;
}
const onlineUsers = new Set();
connectDB().then(() => {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  app.set("io", io);
  io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);
// online and offline status
 socket.on("setup", (userId) => {
  socket.userId = userId;
  socket.join(userId);
  onlineUsers.add(userId);

  io.emit("online_users", Array.from(onlineUsers));
  console.log("👤 User joined personal room:", userId);
});

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`📦 Socket ${socket.id} joined chat room: ${chatId}`);
    });
    socket.on("typing", (chatId) => {
  socket.to(chatId).emit("typing");
});

socket.on("stop_typing", (chatId) => {
  socket.to(chatId).emit("stop_typing");
});

   socket.on("disconnect", () => {
  if (socket.userId) {
    onlineUsers.delete(socket.userId);
    io.emit("online_users", Array.from(onlineUsers));
  }

  console.log("❌ User disconnected:", socket.id);
});
  });

  server.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
  });
});