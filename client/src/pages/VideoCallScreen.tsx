import React, { useEffect, useRef } from "react";
import { getSocketInstance } from "../services/socketService";
import { useParams } from "react-router-dom";
import { config } from "../utils/googleStunServer";

const VideoCallScreen: React.FC = () => {
  const { roomCode } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const socket = getSocketInstance();

    const getLocalStream = async () => {
      try {
        const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Peer Connection
        initiatePeerConnection();
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    const initiatePeerConnection = () => {
      if (localStreamRef.current) {
        const pc = new RTCPeerConnection(config);

        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });

        pc.ontrack = (event) => {
          if (event.streams[0]) {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) socket?.emit("icecandidate", event.candidate);
        };

        peerConnectionRef.current = pc;
      }
    };

    // Socket Event Handlers
    socket?.off("offer");
    socket?.on("offer", async (offer) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit("answer", answer);
      }
    });

    socket?.off("answer");
    socket?.on("answer", async (answer) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket?.off("icecandidate");
    socket?.on("icecandidate", async (candidate) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    getLocalStream();

    // Cleanup
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      socket?.off("offer");
      socket?.off("answer");
      socket?.off("icecandidate");
    };
  }, [roomCode]);

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
