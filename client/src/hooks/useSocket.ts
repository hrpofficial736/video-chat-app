import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocketInstance } from "../services/socketService";


export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get the singleton socket instance
    socketRef.current = getSocketInstance();
  }, []);

  return socketRef.current;
};
