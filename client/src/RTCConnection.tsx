// import React, { useRef, useState } from "react";
// import io from "socket.io-client";


// const RTCConnections: React.FC = () => {
//   const localVideoRef = useRef<HTMLVideoElement>(null);
//   const remoteVideoRef = useRef<HTMLVideoElement>(null);
//   const peerConnection = useRef<RTCPeerConnection | null>(null);
//   const [isCaller, setIsCaller] = useState(false);

//   const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

//   const startCall = async () => {
//     setIsCaller(true);
//     peerConnection.current = new RTCPeerConnection(servers);

//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: true,
//     });

//     stream.getTracks().forEach((track) => {
//       peerConnection.current?.addTrack(track, stream);
//     });

//     if (localVideoRef.current) {
//       localVideoRef.current.srcObject = stream;
//     }

//     peerConnection.current.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     peerConnection.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", event.candidate);
//       }
//     };

//     const offer = await peerConnection.current.createOffer();
//     await peerConnection.current.setLocalDescription(offer);
//     socket.emit("offer", offer);
//   };

//   socket.on("offer", async (offer) => {
//     if (!isCaller) {
//       peerConnection.current = new RTCPeerConnection(servers);

//       peerConnection.current.ontrack = (event) => {
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//         }
//       };

//       peerConnection.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", event.candidate);
//         }
//       };

//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       stream.getTracks().forEach((track) => {
//         peerConnection.current?.addTrack(track, stream);
//       });

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       await peerConnection.current.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );
//       const answer = await peerConnection.current.createAnswer();
//       await peerConnection.current.setLocalDescription(answer);
//       socket.emit("answer", answer);
//     }
//   });

//   socket.on("answer", async (answer) => {
//     if (peerConnection.current) {
//       await peerConnection.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );
//     }
//   });

//   socket.on("ice-candidate", async (candidate) => {
//     if (peerConnection.current) {
//       await peerConnection.current.addIceCandidate(
//         new RTCIceCandidate(candidate)
//       );
//     }
//   });

//   return (
//     <main className="bg-black w-screen h-screen flex gap-4 justify-center items-center">
//       <div className="border border-white w-1/3 h-1/2 rounded-2xl">
//         <video
//           ref={localVideoRef}
//           autoPlay
//           playsInline
//           className="w-full h-full"
//         />
//       </div>
//       <div className="border border-white w-1/3 h-1/2 rounded-2xl">
//         <video
//           ref={remoteVideoRef}
//           autoPlay
//           playsInline
//           className="w-full h-full"
//         />
//       </div>
//       <button
//         onClick={startCall}
//         className="bg-white px-4 py-2 text-black rounded-xl"
//       >
//         Start Call
//       </button>
//     </main>
//   );
// };

// export default RTCConnections;
