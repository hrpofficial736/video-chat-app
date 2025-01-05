// socket.ts
import { Server } from "socket.io";
import http from "http";

let io: Server | null = null;

// Function to initialize the io instance
export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join-room", (info) => {
      console.log("Room joined:", info);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });
};

// Function to get the io instance
export const getSocket = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};
