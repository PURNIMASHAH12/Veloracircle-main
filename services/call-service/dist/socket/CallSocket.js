"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCallSocket = void 0;
const registerCallSocket = (io, socket) => {
    socket.on("call:start", ({ callId, targetUserId, callerName, type, offer, }) => {
        io.to(`user:${targetUserId}`).emit("call:incoming", {
            callId,
            callerId: socket.data.userId,
            callerName,
            type,
            offer,
        });
    });
    socket.on("call:invite", ({ callId, targetUserId, callerName, type, }) => {
        io.to(`user:${targetUserId}`).emit("call:invited", {
            callId,
            inviterId: socket.data.userId,
            inviterName: callerName,
            type,
        });
    });
    socket.on("call:join-request", ({ callId, inviterId, userId, userName, }) => {
        io.to(`user:${inviterId}`).emit("call:join-request", {
            callId,
            userId,
            userName,
        });
    });
    socket.on("call:join-offer", ({ callId, targetUserId, offer, }) => {
        io.to(`user:${targetUserId}`).emit("call:join-offer", {
            callId,
            callerId: socket.data.userId,
            offer,
        });
    });
    socket.on("call:join-answer", ({ callId, callerId, answer, }) => {
        io.to(`user:${callerId}`).emit("call:join-answer", {
            callId,
            userId: socket.data.userId,
            answer,
        });
    });
    socket.on("call:ice-candidate", ({ userId, candidate, senderId, }) => {
        io.to(`user:${userId}`).emit("call:ice-candidate", {
            candidate,
            senderId: senderId || socket.data.userId,
        });
    });
    socket.on("call:answer", ({ callerId, callId, answer, }) => {
        io.to(`user:${callerId}`).emit("call:answered", {
            callId,
            answer,
        });
    });
    socket.on("call:end", ({ callId, targetUserId, }) => {
        if (targetUserId) {
            io.to(`user:${targetUserId}`).emit("call:ended", {
                callId,
            });
        }
    });
    socket.on("call:reject", ({ callId, callerId, }) => {
        io.to(`user:${callerId}`).emit("call:rejected", {
            callId,
        });
    });
};
exports.registerCallSocket = registerCallSocket;
