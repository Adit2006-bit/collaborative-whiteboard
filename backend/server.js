const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const boardRoutes = require("./routes/boardRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://collaborative-whiteboard-two-zeta.vercel.app" 
    ],
    methods: ["GET", "POST"],
  },
});

app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.use("/api/boards", boardRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://collaborative-whiteboard-two-zeta.vercel.app" // 🔥 same link here
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-board", (boardId) => {
    socket.join(boardId);
    console.log(`User joined board: ${boardId}`);
  });

  socket.on("canvas-update", ({ boardId, canvasData }) => {
    socket.to(boardId).emit("receive-update", canvasData);
  });

  socket.on("cursor-move", ({ boardId, cursor }) => {
    socket.to(boardId).emit("receive-cursor", cursor);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});