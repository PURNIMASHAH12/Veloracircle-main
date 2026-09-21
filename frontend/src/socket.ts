import { io } from "socket.io-client";

// Call Service socket
const callSocket = io({
  path: "/socket.io/calls",
  autoConnect: false,
});

// Message Service socket
const messageSocket = io({
  path: "/socket.io/messages",
  autoConnect: false,
});

export const connectCallSocket = () => {
  const token = localStorage.getItem("token");

  callSocket.auth = {
    token,
  };

  if (!callSocket.connected) {
    callSocket.connect();
  }
};

export const connectMessageSocket = () => {
  const token = localStorage.getItem("token");

  messageSocket.auth = {
    token,
  };

  if (!messageSocket.connected) {
    messageSocket.connect();
  }
};

export {
  callSocket,
  messageSocket,
};

export default callSocket;