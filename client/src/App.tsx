import React from "react";
import { Route, Routes } from "react-router-dom";
import Welcome from "./pages/Welcome";
import VideoCallScreen from "./pages/VideoCallScreen";


const App: React.FC = () => {
  return (
    <>
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/:roomCode" element={<VideoCallScreen />} />
    </Routes>
    </>
  );
};

export default App;
