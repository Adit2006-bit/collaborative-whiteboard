import { io } from "socket.io-client";

const socket = io("https://collaborative-whiteboard-backend-3aio.onrender.com");

export default socket;