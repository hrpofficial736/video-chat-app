import React from "react";
import io from "socket.io-client";
import RTCConnections from "./RTCConnection";

export const socket = io("http://localhost:3000");

const App: React.FC = () => {
  return (
    <main className="bg-black w-screen h-screen flex gap-x-2 justify-center items-center">
      <RTCConnections />
    </main>
  );
};

export default App;
