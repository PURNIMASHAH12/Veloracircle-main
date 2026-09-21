import { io } from "socket.io-client";

const socket = io({
  path: "/socket.io",
  autoConnect: false,
});

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

export default socket;