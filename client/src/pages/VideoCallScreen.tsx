import React, { useEffect, useRef } from "react";
import { getSocketInstance } from "../services/socketService";
import { useParams } from "react-router-dom";
import { config } from "../utils/googleStunServer";

const VideoCallScreen: React.FC = () => {
  const { roomCode } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  













  return (
    <main className="bg-black w-screen h-screen flex flex-col justify-center items-center">
      <h1 className="text-4xl text-white font-bold">Room: {roomCode}</h1>
      <div className="flex gap-x-5 items-center justify-center h-1/2 w-screen">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-full h-full border border-white rounded-xl"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full border border-white rounded-xl"
        />
      </div>
    </main>
  );
};

export default VideoCallScreen;
