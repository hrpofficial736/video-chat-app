import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.use(cors());
server.listen(3000, () => {
    console.log("Server is listening on port : 3000");
})