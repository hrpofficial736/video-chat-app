import io, { Socket } from "socket.io-client";
import socketEventListeners from "./socketEvents";
import { NavigateFunction } from "react-router-dom";

let socket : Socket | null = null;

export function initializeSocketServer (navigate: NavigateFunction) {
    try {
        socket = io("http://localhost:3000");
        socketEventListeners(socket, navigate);
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

