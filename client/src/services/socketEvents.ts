// Socket Events

import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";

export default function socketEventListeners (socket: Socket, navigate: NavigateFunction) {
    if (socket) {
        socket.on("room-created", (info : {message: string; roomCode: string;}) => {
            console.log(info);
            navigate(`/lobby/${info.roomCode}`);
        })
        socket.on(
          "room-joined",
          (info: { message: string; roomCode: string }) => {
            console.log(info);
            navigate(`/lobby/${info.roomCode}`);
          }
        );
    }
}