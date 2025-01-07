// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import {
//   FaMicrophone,
//   FaMicrophoneSlash,
//   FaVideo,
//   FaVideoSlash,
// } from "react-icons/fa";

// const LobbyScreen: React.FC = () => {
//   

//     
//     
  
//   return (
//     <main className="bg-black w-screen h-screen px-5 py-3">
//       <h1 className="text-2xl text-white font-bold w-fit">meetX</h1>
//       <div className="h-[90%] flex flex-col justify-center items-center">
//         <div className="w-[80%] h-[70%] flex items-center">
//           <div className="flex flex-col mt-8 gap-y-2 w-[60%] h-full justify-center items-center">
//             <video
//               ref={localVideoRef}
//               autoPlay
//               playsInline
//               className="w-[60%] h-[70%] mt-5 border border-white rounded-2xl"
//             />
//             <div className="flex gap-x-7 mt-2">
//               <div
//                 onClick={toggleAudio}
//                 className={`p-3 rounded-xl border-white border ${
//                   audioAllowed ? "bg-transparent" : "bg-red-500"
//                 }`}
//               >
//                 {audioAllowed ? (
//                   <FaMicrophone color="white" />
//                 ) : (
//                   <FaMicrophoneSlash color="white" />
//                 )}
//               </div>
//               <div
//                 onClick={toggleVideo}
//                 className={`p-3 rounded-xl border-white border ${
//                   videoAllowed ? "bg-transparent" : "bg-red-500"
//                 }`}
//               >
//                 {videoAllowed ? (
//                   <FaVideo color="white" />
//                 ) : (
//                   <FaVideoSlash color="white" />
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="px-3 py-2 w-[30%] h-[70%] border border-white rounded-xl">
//             <h3 className="text-white font-semibold text-center text-2xl">
//               Room : {roomCode}
//             </h3>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default LobbyScreen;
