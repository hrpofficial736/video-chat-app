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
import { getSocketInstance } from "../services/socketService";

const VideoCallScreen: React.FC = () => {
  const { roomCode } = useParams();
  const socket = getSocketInstance();
  const joineeEmail = useLocation().state.localEmail;

  // Remote User Email
  const [remoteUserEmail, setRemoteUserEmail] = useState<string | null>(null);

  // Video and Audio States
  const [audioAllowed, setAudioAllowed] = useState<boolean>(true);
  const [videoAllowed, setVideoAllowed] = useState<boolean>(true);

  const toggleAudio = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled; // Toggle the current state
    });

    socket?.emit("toggled-local-audio", roomCode);
    setAudioAllowed((prevAudioAllowed) => !prevAudioAllowed);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach((track) => {
      if (track.enabled === true) track.enabled = false;
      else track.enabled = true;
    });
    socket?.emit("toggled-local-video", roomCode);
    setVideoAllowed((prevVideoAllowed) => !prevVideoAllowed);
    console.log("Video Allowed: ", videoAllowed);
  };

  const [remoteAudioAllowed, setRemoteAudioAllowed] = useState<boolean>();
  const [remoteVideoAllowed, setRemoteVideoAllowed] = useState<boolean>();

  const toggleRemoteAudio = () => {
    if (!remoteStream) {
      console.error("Remote stream is not available.");
      return;
    }

    // Toggle the enabled property of each audio track
    remoteStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled; // Toggle the current state
    });

    // Update the state to reflect the new status
    setRemoteAudioAllowed((prevState) => !prevState);
  };
  const toggleRemoteVideo = () => {
    if (!remoteStream) {
      console.error("Remote stream is not available.");
      return;
    }

    // Toggle the enabled property of each audio track
    remoteStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled; // Toggle the current state
    });

    // Update the state to reflect the new status
    setRemoteVideoAllowed((prevState) => !prevState);
  };

  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const processIceCandidateQueue = async () => {
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      try {
        await peerConnection.current?.addIceCandidate(candidate!);
        console.log("Processed queued ICE candidate");
      } catch (error) {
        console.error("Error processing queued ICE candidate:", error);
      }
    }
  };
  // Video Ref Elements
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Stream States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(
    new MediaStream(),
  );

  // PeerConnection Ref
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  if (peerConnection.current) {
    peerConnection.current.ontrack = (event) => {
      console.log(event.streams[0]);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };
  }

  // Start Stream

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioAllowed,
        video: videoAllowed,
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      console.log("Local stream initialized: ", stream);

      setLocalStream(stream); // Sets the local stream
      return stream; // Return the stream for immediate use if needed
    } catch (error) {
      console.error("Error starting stream: ", error);
    }
  };

  // Create Offer
  const createConnectionOffer = async () => {
    if (peerConnection.current) {
      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.close();
    }
    peerConnection.current = new RTCPeerConnection(config);

    peerConnection.current.ontrack = (event) => {
      console.log(event.streams[0]);
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    const stream = await startStream();
    if (stream) {
      // Adding local video stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        console.log(track);
        peerConnection.current?.addTrack(track, stream);
      });
    } else {
      console.log("Local stream is not available!");
      return;
    }

    // Listening for ice candidates
    peerConnection.current.onicecandidate = (event) => {
      const candidate = event.candidate;
      console.log("Creating offer and got ice candidates!", candidate);

      if (event.candidate) {
        socket?.emit("ice-candidate", { candidate, roomCode });
      }
    };
    // Listening for incoming tracks

    // Creating offer...
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    console.log("Offer made : ", offer);
    if (socket?.connected) socket?.emit("offer", { offer, roomCode });
    else console.log("Socket not connected!");
  };

  // Start stream in background

  useEffect(() => {
    startStream();
    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      peerConnection.current = new RTCPeerConnection(config);
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      localStream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log("Remote track received: ", event.streams);
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          console.log("ha remote video ref h to sahi");
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          console.log("ye to defined hi nhi h");
        }
        console.log(
          "remoteVideoRef.current.srcObject: ",
          remoteVideoRef.current?.srcObject,
        );
      };
      await peerConnection.current.setRemoteDescription(offer);

      // Process any queued ICE candidates
      await processIceCandidateQueue();

      // exchanging ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        console.log("Handling offer and got ice candidates!", event.candidate);

        const candidate = event.candidate;
        if (event.candidate) {
          socket?.emit("ice-candidate", { candidate, roomCode });
        }
      };

      if (peerConnection.current) {
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket?.emit("answer", { answer, roomCode });
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      console.log("answer aaya");
      if (peerConnection.current) {
        await peerConnection.current?.setRemoteDescription(answer);
        console.log(
          "this is the remote description : ",
          peerConnection.current.currentRemoteDescription,
        );
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      if (candidate) {
        try {
          if (peerConnection.current?.remoteDescription) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
            console.log("Added ICE candidate");
          } else {
            // Queue the candidate if remote description is not set yet
            iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
            console.log("Queued ICE candidate");
          }
        } catch (error) {
          console.error("Error handling ICE candidate:", error);
        }
      }
    };

    const handleUserJoined = (email: string) => {
      setRemoteUserEmail(email);
      console.log("Ha aaya event me!");
      createConnectionOffer();
    };

    const fetchExistingUserEmail = (email: string) => {
      setRemoteUserEmail(email);
    };

    socket?.on("offer", handleOffer);
    socket?.on("answer", handleAnswer);
    socket?.on("ice-candidate", handleIceCandidate);
    socket?.on("user-joined-video", handleUserJoined);
    socket?.on("existing-user-email", fetchExistingUserEmail);
    socket?.on("toggle-video", () => {
      toggleRemoteVideo();
    });
    socket?.on("toggle-audio", () => {
      toggleRemoteAudio();
    });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      peerConnection.current?.close();
      peerConnection.current = null;
    };
  }, [socket, roomCode]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Assigning remote stream to remote video ref.");
      remoteVideoRef.current.srcObject = remoteStream;
      console.log("stream fetched");
    }
  }, [remoteStream, remoteVideoRef]);

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
              {audioAllowed ? (
                <FaMicrophone size={20} />
              ) : (
                <FaMicrophoneSlash size={20} />
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-lg text-white transition-colors ${
                videoAllowed
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {videoAllowed ? (
                <FaVideo size={20} />
              ) : (
                <FaVideoSlash size={20} />
              )}
            </button>
            <button className="p-4 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors">
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
              {localStream?.getVideoTracks()[0]?.enabled ? (
                <video
                  ref={localVideoRef}
                  muted={!audioAllowed}
                  autoPlay
                  playsInline
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
              {remoteVideoAllowed && (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  muted={!remoteAudioAllowed}
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {!remoteStream && (
                <div className="w-full h-full flex flex-col gap-y-5 justify-center items-center">
                  <div className="rounded-full w-20 h-20 bg-blue-500 flex justify-center items-center text-white text-2xl font-bold">
                    {remoteUserEmail?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-white font-medium">{remoteUserEmail}</p>
                </div>
              )}
              <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-lg">
                {remoteUserEmail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VideoCallScreen;
