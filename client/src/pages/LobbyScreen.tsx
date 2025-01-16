import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";


import { getSocketInstance } from "../services/socketService";

const LobbyScreen: React.FC = () => {
  const members : string[] = useLocation().state.roomMembers;
  console.log(members);
  const joineeEmail = useLocation().state.email;
  const myRole = useLocation().state.role;
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [roomMembers, setRoomMembers] = useState<Array<string>>(members !== null ? members : []);

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
    } catch (error) {
      console.error("Error restarting stream:", error);
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

  const socket = getSocketInstance();
  socket?.on("user-joined", (user) => {
    const { userEmail } = user;
    setRoomMembers((prevMembers) => {
      if (!prevMembers.includes(userEmail)) {
        return [...prevMembers, userEmail];
      }
      return prevMembers;
    });
  });

  socket?.on("remove-user", (userEmail: string) => {
    setRoomMembers((prevMembers) => {
      if (!prevMembers.includes(userEmail)) return prevMembers;
      return prevMembers.filter((member) => member !== userEmail);  
    })
  })

  return (
    <main className="bg-black w-screen h-screen px-5 py-3">
      <h1 className="text-2xl text-white font-bold w-fit">meetX</h1>
      <div className="h-[90%] flex flex-col justify-center items-center">
        <div className="w-[80%] h-[70%] flex items-center">
          <div className="flex flex-col mt-8 gap-y-2 w-[60%] h-full justify-center items-center">
            {/* Local video preview */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              className="w-[60%] h-[70%] mt-5 border border-white rounded-2xl"
            />
            {/* Controls for audio and video */}
            <div className="flex gap-x-7 mt-2">
              <div
                onClick={toggleAudio}
                className={`p-3 rounded-xl cursor-pointer border-white border ${
                  audioAllowed
                    ? "bg-transparent hover:bg-zinc-800"
                    : "bg-red-500"
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
                className={`p-3 rounded-xl cursor-pointer border-white border ${
                  videoAllowed ? "bg-transparent hover:bg-zinc-800" : "bg-red-500"
                }`}
              >
                {videoAllowed ? (
                  <FaVideo color="white" />
                ) : (
                  <FaVideoSlash color="white" />
                )}
              </div>
            </div>
          </div>

          {/* Room code display */}
          <div className="px-3 py-2 w-[30%] h-[70%] border border-white rounded-xl">
            <h3 className="text-white font-semibold text-center text-2xl">
              Room : {roomCode}
            </h3>
            <div className="mt-5">
            {roomMembers.map((member, index) => {
              return <div className="text-white mb-2 flex bg-zinc-800 px-3 py-1 rounded" key={index}>{index + 1} . {member}</div>;
            })}
            </div>
          </div>
        </div>
        <button onClick={() => {
            socket?.emit("join-video", {email: joineeEmail, roomCode: roomCode, role: myRole});
            navigate(`/${roomCode}`, {state: {
                localEmail: joineeEmail,
                role: myRole
            }})
        }} className="bg-white px-6 cursor-pointer hover:bg-slate-200 py-3 rounded-lg font-bold text-black ">
          Join Call
        </button>
      </div>
    </main>
  );
};

export default LobbyScreen;
