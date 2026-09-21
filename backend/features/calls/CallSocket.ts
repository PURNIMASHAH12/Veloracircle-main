import { Server, Socket } from "socket.io";

export const registerCallSocket = (
  io: Server,
  socket: Socket,
) => {
  // =====================================================
  // Start a call
  // =====================================================

  socket.on(
    "call:start",
    ({
      callId,
      targetUserId,
      callerName,
      type,
      offer,
    }: {
      callId: string;
      targetUserId: string;
      callerName: string;
      type: "audio" | "video";
      offer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${targetUserId}`).emit(
        "call:incoming",
        {
          callId,
          callerId: socket.data.userId,
          callerName,
          type,
          offer,
        },
      );
    },
  );

  // =====================================================
  // Invite another user to an existing call
  // =====================================================

  socket.on(
    "call:invite",
    ({
      callId,
      targetUserId,
      callerName,
      type,
    }: {
      callId: string;
      targetUserId: string;
      callerName: string;
      type: "audio" | "video";
    }) => {
      io.to(`user:${targetUserId}`).emit(
        "call:invited",
        {
          callId,
          inviterId: socket.data.userId,
          inviterName: callerName,
          type,
        },
      );
    },
  );

  // =====================================================
  // Invited user requests to join the existing call
  // =====================================================

  socket.on(
    "call:join-request",
    ({
      callId,
      inviterId,
      userId,
      userName,
    }: {
      callId: string;
      inviterId: string;
      userId: string;
      userName: string;
    }) => {
      io.to(`user:${inviterId}`).emit(
        "call:join-request",
        {
          callId,
          userId,
          userName,
        },
      );
    },
  );

  // =====================================================
  // Existing caller sends an offer to invited user
  // =====================================================

  socket.on(
    "call:join-offer",
    ({
      callId,
      targetUserId,
      offer,
    }: {
      callId: string;
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${targetUserId}`).emit(
        "call:join-offer",
        {
          callId,
          callerId: socket.data.userId,
          offer,
        },
      );
    },
  );

  // =====================================================
  // Invited user answers the join offer
  // =====================================================

  socket.on(
    "call:join-answer",
    ({
      callId,
      callerId,
      answer,
    }: {
      callId: string;
      callerId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      io.to(`user:${callerId}`).emit(
        "call:join-answer",
        {
          callId,
          userId: socket.data.userId,
          answer,
        },
      );
    },
  );

  // =====================================================
  // ICE candidate exchange
  // =====================================================

  socket.on(
  "call:ice-candidate",
  ({
    userId,
    candidate,
    senderId,
  }: {
    userId: string;
    candidate: RTCIceCandidateInit;
    senderId?: string;
  }) => {
    io.to(`user:${userId}`).emit(
      "call:ice-candidate",
      {
        candidate,
        senderId:
          senderId || socket.data.userId,
      },
    );
  },
);
  // =====================================================
  // Answer a normal 1-to-1 call
  // =====================================================

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

  // =====================================================
  // End a call
  // =====================================================

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

  // =====================================================
  // Reject a call
  // =====================================================

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