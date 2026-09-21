"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.setIO = void 0;
let io = null;
const setIO = (server) => {
    io = server;
};
exports.setIO = setIO;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized");
    }
    return io;
};
exports.getIO = getIO;
