import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { config } from "../utils/googleStunServer";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { MdCallEnd } from "react-icons/md";

const VideoCallScreen: React.FC = () => {
  const joineeEmail: string = useLocation().state.localEmail;
  const [remoteUserEmail, setRemoteUserEmail] = useState<string | null>(null);
  const { roomCode } = useParams();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [audioAllowed, setAudioAllowed] = useState<boolean>(true);
  const [videoAllowed, setVideoAllowed] = useState<boolean>(true);

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
      createOffer();
    } catch (error) {
      console.error("Error restarting stream:", error);
      setAudioAllowed(false);
      setVideoAllowed(false);
    }
  };

  useEffect(() => {
    restartStream(audioAllowed, videoAllowed);

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    restartStream(audioAllowed, videoAllowed);
  }, [audioAllowed, videoAllowed]);

  const toggleAudio = () => {
    setAudioAllowed((prevAudioAllowed) => !prevAudioAllowed);
  };

  const toggleVideo = () => {
    setVideoAllowed((prevVideoAllowed) => !prevVideoAllowed);
  };

  // signaling begins

  const createOffer = async () => {
    // Creating the offer
    peerConnection.current = new RTCPeerConnection(config);

    // exchanging ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", event.candidate);
      }
    };

    // listening for incoming tracks

    peerConnection.current.ontrack = (event) => {
      if (event.streams) {
        const [incomingRemoteStream] = event.streams;
        setRemoteStream(incomingRemoteStream);
        if (remoteVideoRef.current)
          remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    localStream?.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream);
    });

    await peerConnection.current.createOffer().then((offer) => {
      peerConnection.current?.setLocalDescription(offer);
      socket?.emit("offer", { offer, roomCode });
    });
  };

  // Receiving an offer and generating a corresponding answer.
  socket?.on("offer", async (offer: RTCSessionDescriptionInit) => {
    peerConnection.current = new RTCPeerConnection();

    // exchanging ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", {candidate: event.candidate, roomCode: roomCode});
      }
    };

    if (peerConnection.current) {
      await peerConnection?.current?.setRemoteDescription(
        new RTCSessionDescription(offer) // Setting other one's offer as our remote description
      );
      const answer = await peerConnection.current?.createAnswer(); // generating an answer
      await peerConnection.current?.setLocalDescription(answer); // setting our answer as our local description
      socket.emit("answer", { answer, roomCode });
    } // emitting answer event to the signaling server
  });

  // Receiving an answer and starting the stream connection b/w the peers.
  socket?.on("answer", async (answer: RTCSessionDescriptionInit) => {
    if (peerConnection.current)
      await peerConnection.current.setRemoteDescription(answer);
    else console.log("peerConnection.current is null!");
  });

  // Adding ICE candidates to the peer connection.
  socket?.on("ice-candidate", async (candidate: RTCIceCandidateInit) => {
    if (candidate && peerConnection.current) {
      await peerConnection.current?.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  });

  socket?.on("user-joined-video", async (email: string) => {
    console.log(email, "joined the room.");
    await createOffer();
    setRemoteUserEmail(email);
  });

  return (
    <main className="bg-black w-screen h-screen px-5 py-3 overflow-hidden">
      {/* Logo */}
      <h1 className="text-2xl text-white font-bold w-fit">meetX</h1>

      <div className="flex flex-col items-center h-[90%]">
        {/* Top Menu Bar */}
        <div className="bg-zinc-800 rounded-xl w-[90%] h-20 mt-5 px-7 flex justify-between items-center">
          <h1 className="text-xl text-white font-bold">
            Room: {roomCode} (Total Participants: 2 )
          </h1>

          {/* ToolBar */}
          <div className="flex gap-x-10">
            <div
              onClick={toggleAudio}
              className={`px-5 py-4 rounded-lg text-white cursor-pointer ${
                audioAllowed ? "bg-zinc-700 hover:bg-zinc-500" : "bg-red-500"
              }`}
            >
              {audioAllowed ? (
                <FaMicrophone color="white" />
              ) : (
                <FaMicrophoneSlash color="white" />
              )}
            </div>
            <div
              onClick={toggleVideo}
              className={`px-5 py-4 rounded-lg text-white cursor-pointer ${
                videoAllowed ? "bg-zinc-700 hover:bg-zinc-500" : "bg-red-500"
              }`}
            >
              {videoAllowed ? (
                <FaVideo color="white" />
              ) : (
                <FaVideoSlash color="white" />
              )}
            </div>
            <div className="px-5 py-4 bg-red-500 rounded-lg text-white cursor-pointer">
              <MdCallEnd size={16} />
            </div>
          </div>
        </div>

        {/* Video and Chat Container */}
        <div className="flex w-full h-full border border-white mt-5 rounded-xl">
          {/* Videos Container */}
          <div className="w-[70%] h-full bg-zinc-900 rounded-tl-xl rounded-bl-xl p-4 flex gap-x-5">
            {/* Local Video */}
            <div className="w-full bg-zinc-800 rounded-xl flex flex-col justify-center items-center overflow-hidden">
              {videoAllowed ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-2xl"
                />
              ) : (
                <div className="w-full bg-zinc-800 rounded-xl flex flex-col gap-y-5 justify-center items-center">
                  <div className="rounded-full px-7 py-5 bg-blue-500 flex justify-center items-center font-bold font-sans">
                    {joineeEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-white font-bold text-sm">
                    {joineeEmail}
                  </div>
                </div>
              )}
            </div>

            {/* Remote Video Streams */}
            <div className="w-full bg-zinc-800 rounded-xl flex flex-col gap-y-5 justify-center items-center">
            {remoteStream ? (
              <video
                autoPlay
                ref={remoteVideoRef}
                playsInline
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : remoteUserEmail ? (
              <div className="w-full bg-zinc-800 rounded-xl flex flex-col gap-y-5 justify-center items-center">
                <div className="rounded-full px-7 py-5 bg-blue-500 flex justify-center items-center font-bold font-sans">
                  {remoteUserEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="text-white font-bold text-sm">
                  {remoteUserEmail}
                </div>
              </div>
            ) : null}
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex flex-col pb-2 items-center gap-y-2 w-[30%] h-full">
            <div className="px-4 py-2 bg-zinc-700 w-full h-10 rounded-tr-xl text-white font-bold">
              Room Chat
            </div>

            <div className="overflow-y-scroll no-scrollbar m-4 bg-zinc-400 w-[90%] h-[78%]"></div>

            <div className="flex gap-x-2 w-full justify-center">
              <div className="rounded-full px-4 py-2 bg-blue-500 flex justify-center items-center font-bold font-sans">
                H
              </div>
              <input
                type="text"
                className="px-3 w-[80%] rounded-lg bg-zinc-900 text-white"
                placeholder="Type message..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-x-5 items-center justify-center h-1/2 w-screen"></div>
    </main>
  );
};

export default VideoCallScreen;
