import React, { useEffect } from "react";
import { useState } from "react";
import {
  initializeSocketServer,
  getSocketInstance,
} from "../services/socketService";
import { useNavigate } from "react-router-dom";

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  // Initializing socket connection with server in background
  useEffect(() => {
    initializeSocketServer(navigate);
  }, []);

  const [joinRoomformData, setJoinRoomFormData] = useState<{
    email: string;
    roomCode: string;
  }>({
    email: "",
    roomCode: "",
  });

  const [createRoomFormData, setCreateRoomFormData] = useState<{
    email: string;
  }>({
    email: "",
  });

  const handleJoinRoomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = getSocketInstance();
    if (socket !== null) {
      socket.emit("join-room", joinRoomformData);
      socket.on(
        "room-joined",
        (info: { message: string; roomCode: string; roomMembers: string[]; }) => {
          navigate(`/lobby/${info.roomCode}`, {state: {
            email: joinRoomformData.email,
            roomCode: info.roomCode,
            roomMembers: info.roomMembers
          }});
        }
      );
    } else {
      console.log("Socket is null!");
    }
  };
  const handleCreateRoomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = getSocketInstance();
    if (socket !== null) {
      socket.emit("create-room", createRoomFormData);
      socket.on(
        "room-created",
        (info: { message: string; roomCode: string; roomMembers: string[]; }) => {
          navigate(`/lobby/${info.roomCode}`, {state: {
            email: createRoomFormData.email,
            roomCode: info.roomCode,
            roomMembers: info.roomMembers
          }});
        }
      );
    } else {
      console.log("Socket is null!");
    }
  };

  return (
    <div className="bg-black w-screen h-screen text-white flex flex-col gap-y-5 justify-center items-center">
      <h1 className="text-4xl text-white font-bold text-center">
        Welcome to meetX
      </h1>

      <div className="flex gap-x-10 items-center">
        {/* Join Room */}
        <form
          onSubmit={handleJoinRoomFormSubmit}
          className="px-10 py-5 border border-white rounded-2xl flex flex-col gap-y-2 justify-center items-center"
        >
          <h3 className="text-xl font-bold">Join Room</h3>
          <label>Email</label>
          <input
            required
            name="email"
            onChange={(e) =>
              setJoinRoomFormData((prevData) => ({
                ...prevData,
                [e.target.name]: e.target.value,
              }))
            }
            value={joinRoomformData.email}
            placeholder="Email"
            className="text-white border border-white rounded-xl bg-black px-2"
            type="email"
          />
          <br />
          <label>Room-Code</label>
          <input
            required
            name="roomCode"
            onChange={(e) =>
              setJoinRoomFormData((prevData) => ({
                ...prevData,
                [e.target.name]: e.target.value,
              }))
            }
            value={joinRoomformData.roomCode}
            placeholder="Room-Code"
            className="text-white border border-white rounded-xl bg-black px-2"
            type="text"
          />
          <button
            className="bg-white cursor-pointer mt-5 px-4 py-2 text-black font-bold rounded-xl"
            type="submit"
          >
            Join Room
          </button>
        </form>

        <h5>Or</h5>

        {/* Create Room */}
        <form
          onSubmit={handleCreateRoomFormSubmit}
          className="px-10 py-5 border border-white rounded-2xl flex flex-col gap-y-2 justify-center items-center"
        >
          <h3 className="text-xl font-bold">Create Room</h3>
          <label>Email</label>
          <input
            required
            name="email"
            onChange={(e) =>
              setCreateRoomFormData((prevData) => ({
                ...prevData,
                [e.target.name]: e.target.value,
              }))
            }
            value={createRoomFormData.email}
            placeholder="Email"
            className="text-white border border-white rounded-xl bg-black px-2"
            type="email"
          />

          <button
            className="bg-white cursor-pointer mt-5 px-4 py-2 text-black font-bold rounded-xl"
            type="submit"
          >
            Create Room
          </button>
        </form>
      </div>
    </div>
  );
};

export default Welcome;
