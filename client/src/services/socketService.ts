import io, { Socket } from "socket.io-client";

let socket : Socket | null = null;

export function initializeSocketServer () {
    try {
        socket = io("http://localhost:3000");
    } catch (error) {
        console.error("Socket initialization failed:", error);
    }
}

export function getSocketInstance () {
    if (!socket) {
      console.warn("Socket instance is not initialized.");
      return null;
    }
    return socket;
}