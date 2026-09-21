"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReadReceiptSocket = void 0;
const ReadReceipts_1 = require("../features/messages/ReadReceipts");
const registerReadReceiptSocket = (io, socket) => {
    socket.on("markMessagesAsRead", async ({ conversationId, userId, }) => {
        try {
            const messageIds = await (0, ReadReceipts_1.markConversationMessagesAsRead)({
                conversationId,
                userId,
            });
            if (messageIds.length === 0) {
                return;
            }
            io.to(`conversation:${conversationId}`).emit("messagesRead", {
                conversationId,
                userId,
                messageIds,
            });
        }
        catch (error) {
            console.error("Read receipt socket error:", error);
        }
    });
};
exports.registerReadReceiptSocket = registerReadReceiptSocket;
