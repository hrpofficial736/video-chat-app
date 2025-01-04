import { io } from "..";

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });
  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  })
  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate); 
  });
});
