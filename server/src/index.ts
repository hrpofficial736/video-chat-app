// index.ts
import express from "express";
import http from "http";
import cors from "cors";
import { initSocket } from "./sockets/sockets";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());

// Test endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Initialize Socket.IO
initSocket(server);

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port: ${PORT}`);
});
