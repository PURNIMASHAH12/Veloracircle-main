import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { registerReadReceiptSocket } from "./features/messages/readReceiptSocket";
let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    registerReadReceiptSocket(io, socket);
    // Join personal user room
    socket.on("joinUser", (userId: string) => {
      socket.join(`user:${userId}`);

      console.log(
        `Socket ${socket.id} joined user room ${userId}`,
      );
    });

    // Join conversation room
    socket.on("joinConversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);

      console.log(
        `Socket ${socket.id} joined conversation ${conversationId}`,
      );
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};