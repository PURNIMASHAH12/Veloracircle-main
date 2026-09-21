import { io } from "socket.io-client";

const socket = io({
  path: "/socket.io",
  autoConnect: false,
});

export default socket;