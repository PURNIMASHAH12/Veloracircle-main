"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.getMessages = exports.sendMessage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Message_1 = __importDefault(require("../models/Message"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const getUserFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return null;
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not configured");
            return null;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const userId = decoded.id ||
            decoded.userId ||
            decoded._id;
        if (!userId) {
            return null;
        }
        return {
            id: userId,
            role: decoded.role || "user",
        };
    }
    catch (error) {
        console.error("JWT verification error:", error);
        return null;
    }
};
/* =====================================================
   SEND MESSAGE
===================================================== */
const sendMessage = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const { conversationId, text } = req.body;
        if (!conversationId || !text) {
            res.status(400).json({
                message: "Conversation ID and text are required",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({
                message: "Invalid conversation ID",
            });
            return;
        }
        const cleanText = String(text).trim();
        if (!cleanText) {
            res.status(400).json({
                message: "Message text cannot be empty",
            });
            return;
        }
        if (cleanText.length > 2000) {
            res.status(400).json({
                message: "Message cannot exceed 2000 characters",
            });
            return;
        }
        const conversation = await Conversation_1.default.findById(conversationId);
        if (!conversation) {
            res.status(404).json({
                message: "Conversation not found",
            });
            return;
        }
        const isParticipant = conversation.participants.some((participant) => participant.toString() === user.id);
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        const message = await Message_1.default.create({
            conversation: conversationId,
            sender: user.id,
            text: cleanText,
        });
        const populatedMessage = await Message_1.default.findById(message._id).populate("sender", "name email");
        res.status(201).json({
            message: populatedMessage,
        });
    }
    catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.sendMessage = sendMessage;
/* =====================================================
   GET MESSAGES
===================================================== */
const getMessages = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const conversationId = req.params.conversationId;
        if (!mongoose_1.default.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({
                message: "Invalid conversation ID",
            });
            return;
        }
        const conversation = await Conversation_1.default.findById(conversationId);
        if (!conversation) {
            res.status(404).json({
                message: "Conversation not found",
            });
            return;
        }
        const isParticipant = conversation.participants.some((participant) => participant.toString() === user.id);
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        const messages = await Message_1.default.find({
            conversation: conversationId,
        })
            .populate("sender", "name email")
            .sort({ createdAt: 1 })
            .limit(200);
        res.status(200).json({
            data: messages,
        });
    }
    catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.getMessages = getMessages;
/* =====================================================
   DELETE MESSAGE
===================================================== */
const deleteMessage = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const messageId = req.params.messageId;
        if (!mongoose_1.default.Types.ObjectId.isValid(messageId)) {
            res.status(400).json({
                message: "Invalid message ID",
            });
            return;
        }
        const message = await Message_1.default.findById(messageId);
        if (!message) {
            res.status(404).json({
                message: "Message not found",
            });
            return;
        }
        if (message.sender.toString() !== user.id) {
            res.status(403).json({
                message: "You can only delete your own messages",
            });
            return;
        }
        await Message_1.default.findByIdAndDelete(messageId);
        res.status(200).json({
            message: "Message deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete message error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.deleteMessage = deleteMessage;
