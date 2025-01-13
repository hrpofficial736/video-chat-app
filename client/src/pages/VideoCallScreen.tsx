import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {getSocketInstance} from "../services/socketService"
import { config } from "../utils/googleStunServer";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { MdCallEnd, MdSend } from "react-icons/md";
import { useSocket } from "../hooks/useSocket";



const VideoCallScreen: React.FC = () => {
  const socket = useSocket();
  const joineeEmail = useLocation().state?.localEmail;
  const { roomCode } = useParams();

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteUserEmail, setRemoteUserEmail] = useState<string | null>(null);
  const [audioAllowed, setAudioAllowed] = useState<boolean>(true);
  const [videoAllowed, setVideoAllowed] = useState<boolean>(true);
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string }>
  >([]);

  const restartStream = async (enableAudio: boolean, enableVideo: boolean) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: enableAudio,
        video: enableVideo,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setLocalStream(stream);

      if (
        peerConnection.current &&
        peerConnection.current.connectionState === "connected"
      ) {
        const audioTrack = stream.getAudioTracks()?.[0];
        const videoTrack = stream.getVideoTracks()?.[0];

        if (audioTrack) {
          peerConnection.current.addTrack(audioTrack, stream);
        }
        if (videoTrack) {
          peerConnection.current.addTrack(videoTrack, stream);
        }
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      setAudioAllowed(false);
      setVideoAllowed(false);
    }
  };

  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    peerConnection.current = new RTCPeerConnection(config);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", { candidate: event.candidate, roomCode });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (event.streams?.[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    if (localStream) {
      const audioTrack = localStream.getAudioTracks()?.[0];
      const videoTrack = localStream.getVideoTracks()?.[0];

      if (audioTrack) {
        peerConnection.current.addTrack(audioTrack, localStream);
      }
      if (videoTrack) {
        peerConnection.current.addTrack(videoTrack, localStream);
      }
    }
  }, [localStream, roomCode, socket]);

  const createOffer = async () => {
    try {
      initializePeerConnection();

      if (!peerConnection.current) return;

      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.current.setLocalDescription(offer);
      socket?.emit("offer", { offer, roomCode });
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  };

  useEffect(() => {
    // Initial stream setup
    restartStream(audioAllowed, videoAllowed);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []); // Empty dependency array for initial setup only

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        initializePeerConnection();
        if (!peerConnection.current) return;

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.current.setLocalDescription(answer);
        socket.emit("answer", { answer, roomCode });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
        }
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      try {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    };

    const handleUserJoined = async (email: string) => {
      setRemoteUserEmail(email);
      await createOffer();
    };

    const handleChatMessage = (message: { sender: string; text: string }) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("user-joined-video", handleUserJoined);
    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-joined-video", handleUserJoined);
      socket.off("chat-message", handleChatMessage);
    };
  }, [socket, roomCode, initializePeerConnection, createOffer]);

  useEffect(() => {
    restartStream(audioAllowed, videoAllowed);
  }, [audioAllowed, videoAllowed]);

  const toggleAudio = () => setAudioAllowed((prev) => !prev);
  const toggleVideo = () => setVideoAllowed((prev) => !prev);

  const handleEndCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    // Navigate back or handle call end
  };

  const sendMessage = () => {
    const message = chatInputRef.current?.value.trim();
    if (message && socket) {
      socket.emit("chat-message", {
        roomCode,
        message: {
          sender: joineeEmail,
          text: message,
        },
      });
      setMessages((prev) => [...prev, { sender: joineeEmail, text: message }]);
      if (chatInputRef.current) {
        chatInputRef.current.value = "";
      }
    }
  };

  return (
    <main className="bg-black w-screen h-screen px-5 py-3 overflow-hidden">
      <h1 className="text-2xl text-white font-bold w-fit">meetX</h1>

      <div className="flex flex-col items-center h-[90%]">
        {/* Top Menu Bar */}
        <div className="bg-zinc-800 rounded-xl w-[90%] h-20 mt-5 px-7 flex justify-between items-center">
          <h1 className="text-xl text-white font-bold">Room: {roomCode}</h1>

          {/* Controls */}
          <div className="flex gap-x-10">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-lg text-white transition-colors ${
                audioAllowed
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {audioAllowed ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-lg text-white transition-colors ${
                videoAllowed
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {videoAllowed ? <FaVideo size={20} /> : <FaVideoSlash size={20} />}
            </button>
            <button
              onClick={handleEndCall}
              className="p-4 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
            >
              <MdCallEnd size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex w-full h-full mt-5 gap-x-5">
          {/* Videos Container */}
          <div className="w-[70%] h-full bg-zinc-900 rounded-xl p-4 flex gap-x-5">
            {/* Local Video */}
            <div className="w-1/2 bg-zinc-800 rounded-xl overflow-hidden relative">
              {videoAllowed ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col gap-y-5 justify-center items-center">
                  <div className="rounded-full w-20 h-20 bg-blue-500 flex justify-center items-center text-white text-2xl font-bold">
                    {joineeEmail?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-white font-medium">{joineeEmail}</p>
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-lg">
                You
              </div>
            </div>

            {/* Remote Video */}
            <div className="w-1/2 bg-zinc-800 rounded-xl overflow-hidden relative">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : remoteUserEmail ? (
                <div className="w-full h-full flex flex-col gap-y-5 justify-center items-center">
                  <div className="rounded-full w-20 h-20 bg-blue-500 flex justify-center items-center text-white text-2xl font-bold">
                    {remoteUserEmail[0].toUpperCase()}
                  </div>
                  <p className="text-white font-medium">{remoteUserEmail}</p>
                </div>
              ) : (
                <div className="w-full h-full flex justify-center items-center">
                  <p className="text-white/50">Waiting for participant...</p>
                </div>
              )}
              {remoteUserEmail && (
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-lg">
                  {remoteUserEmail}
                </div>
              )}
            </div>
          </div>

          {/* Chat Container */}
          <div className="w-[30%] bg-zinc-900 rounded-xl flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold">Chat</h2>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.sender === joineeEmail ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      msg.sender === joineeEmail
                        ? "bg-blue-500 text-white"
                        : "bg-zinc-700 text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{msg.sender}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-x-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  <MdSend size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VideoCallScreen;