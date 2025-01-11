// socket.ts
import { Server } from "socket.io";
import http from "http";

let io: Server | null = null;

interface JoiningUserInfo {
  email: string;
  roomCode: string;
}

interface Room {
  [roomCode: string]: string[];
}

const rooms: Room = {};

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

    socket.on("join-room", (info: JoiningUserInfo) => {
      const { email, roomCode } = info;
      console.log(info);
      
      if (!rooms[roomCode]) {
        rooms[roomCode] = [];
      }

      rooms[roomCode].push(email);
      socket.join(roomCode);

      console.log(`Room ${roomCode} joined by ${email}.`);
      console.log(rooms[roomCode]);
      
      socket.emit("room-joined", {
        message: `Room ${roomCode} joined by ${email}.`,
        roomCode: roomCode,
        roomMembers: rooms[roomCode]
      });

      socket.to(roomCode).emit("user-joined", {
        userId: socket.id,
        userEmail: email
      });
    });
    socket.on("create-room", (info) => {
      const { email } = info;
      const roomCode = Math.random().toString(36).substring(2, 10);
      rooms[roomCode] = [];
      console.log(`Room created by ${email} with room-code : ${roomCode}`);
      rooms[roomCode].push(email);
      socket.join(roomCode);
      socket.emit("room-created", {
        message: `Room created by ${email} with room-code : ${roomCode}`,
        roomCode: roomCode,
        roomMembers: rooms[roomCode]
      });
    });


    socket.on("join-video", (info : {
      email: string;
      roomCode: string;
    }) => {
      socket.to(info.roomCode).emit("user-joined-video", info.email);
    })




    socket.on(
      "offer",
      ({
        offer,
        roomCode,
      }: {
        offer: RTCSessionDescriptionInit;
        roomCode: string;
      }) => {
        console.log("Offer received in room : ", roomCode);
        socket.to(roomCode).emit("offer", offer);
      }
    );

    socket.on(
      "answer",
      ({
        answer,
        roomCode,
      }: {
        answer: RTCSessionDescriptionInit;
        roomCode: string;
      }) => {
        console.log("Answer received in room : ", roomCode);
        socket.to(roomCode).emit("answer", answer);
      }
    );
     socket.on(
       "ice-candidate",
       ({
         candidate,
         roomCode,
       }: {
         candidate: RTCIceCandidateInit;
         roomCode: string;
       }) => {
         console.log(`ICE candidate received in room ${roomCode}`);
         socket.to(roomCode).emit("ice-candidate", candidate); // Send the ICE candidate to other clients in the room
       }
     );

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      for (const roomCode in rooms) {
        rooms[roomCode] = rooms[roomCode].filter((id) => id !== socket.id);
        if (rooms[roomCode].length === 0) {
          delete rooms[roomCode]; // Delete the room if empty
        }
      }
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
