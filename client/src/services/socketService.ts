import io, { Socket } from "socket.io-client";

let socket : Socket | null = null;

export const initializeSocket = () => {
    try {
        if (socket) return;
        socket = io("http://localhost:3000");
        console.log("Socket server is initialized");
    
    } catch (error) {
        console.error("Error initializing socket server.");
    }
}


export const getSocketInstance = () : Socket | null => {
    try {
        if (socket) return socket;
        else initializeSocket();
        return socket;
    } catch (error) {
        console.error("Error accessing the socket instance.");
        return null;
    }
}