import { Server, Socket } from "socket.io";

export const registerCallSocket = (
  io: Server,
  socket: Socket,
) => {
  // Start a call
  socket.on(
    "call:start",
    ({
      callId,
      targetUserId,
      type,
      offer,
    }: {
      callId: string;
      targetUserId: string;
      type: "audio" | "video";
      offer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${targetUserId}`).emit(
        "call:incoming",
        {
          callId,
          callerId: socket.data.userId,
          type,
          offer,
        },
      );
    },
  );

  // Answer a call
  socket.on(
    "call:answer",
    ({
      callerId,
      callId,
      answer,
    }: {
      callerId: string;
      callId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${callerId}`).emit(
        "call:answered",
        {
          callId,
          answer,
        },
      );
    },
  );

  // ICE candidate exchange
  socket.on(
    "call:ice-candidate",
    ({
      userId,
      candidate,
    }: {
      userId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      io.to(`user:${userId}`).emit(
        "call:ice-candidate",
        {
          candidate,
        },
      );
    },
  );

  // End a call
  socket.on(
    "call:end",
    ({
      callId,
      targetUserId,
    }: {
      callId: string;
      targetUserId?: string;
    }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit(
          "call:ended",
          {
            callId,
          },
        );
      }
    },
  );

  // Reject a call
  socket.on(
    "call:reject",
    ({
      callId,
      callerId,
    }: {
      callId: string;
      callerId: string;
    }) => {
      io.to(`user:${callerId}`).emit(
        "call:rejected",
        {
          callId,
        },
      );
    },
  );
};