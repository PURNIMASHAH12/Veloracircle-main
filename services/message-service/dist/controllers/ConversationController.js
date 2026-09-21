"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.togglePinConversation = exports.markConversationAsRead = exports.getMyConversations = exports.createOrGetConversation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const getUserFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return null;
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return null;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const id = decoded.id ||
            decoded.userId ||
            decoded._id;
        if (!id) {
            return null;
        }
        return {
            id,
            role: decoded.role || "user",
        };
    }
    catch {
        return null;
    }
};
/* =====================================================
   CREATE / GET CONVERSATION
===================================================== */
const createOrGetConversation = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                message: "User ID is required",
            });
            return;
        }
        if (!mongoose_1.default.isValidObjectId(userId)) {
            res.status(400).json({
                message: "Invalid user ID",
            });
            return;
        }
        if (userId === user.id) {
            res.status(400).json({
                message: "You cannot create a conversation with yourself",
            });
            return;
        }
        let conversation = await Conversation_1.default.findOne({
            type: "direct",
            participants: {
                $all: [
                    new mongoose_1.default.Types.ObjectId(user.id),
                    new mongoose_1.default.Types.ObjectId(userId),
                ],
            },
        });
        if (!conversation) {
            conversation =
                await Conversation_1.default.create({
                    type: "direct",
                    participants: [
                        new mongoose_1.default.Types.ObjectId(user.id),
                        new mongoose_1.default.Types.ObjectId(userId),
                    ],
                    unreadCounts: {},
                    pinnedBy: [],
                    deletedFor: [],
                });
        }
        // If previously deleted, restore it for this user.
        conversation.deletedFor =
            conversation.deletedFor.filter((id) => id.toString() !== user.id);
        await conversation.save();
        res.status(200).json({
            conversation: {
                id: conversation._id,
                type: conversation.type,
            },
        });
    }
    catch (error) {
        console.error("Create/Get conversation error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.createOrGetConversation = createOrGetConversation;
/* =====================================================
   GET MY CONVERSATIONS
===================================================== */
const getMyConversations = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const userObjectId = new mongoose_1.default.Types.ObjectId(user.id);
        const conversations = await Conversation_1.default.find({
            type: "direct",
            participants: userObjectId,
            deletedFor: {
                $ne: userObjectId,
            },
        })
            .populate("participants", "name email")
            .sort({ updatedAt: -1 });
        const result = await Promise.all(conversations.map(async (conversation) => {
            const otherParticipant = conversation.participants.find((participant) => participant._id.toString() !==
                user.id);
            const latestMessage = await Message_1.default.findOne({
                conversation: conversation._id,
            })
                .sort({ createdAt: -1 })
                .lean();
            return {
                id: conversation._id,
                type: conversation.type,
                unreadCount: conversation.unreadCounts?.get(user.id) || 0,
                pinned: conversation.pinnedBy?.some((id) => id.toString() === user.id) || false,
                otherUser: otherParticipant
                    ? {
                        id: otherParticipant._id,
                        name: otherParticipant.name,
                        email: otherParticipant.email,
                    }
                    : null,
                latestMessage: latestMessage
                    ? {
                        text: latestMessage.text,
                        createdAt: latestMessage.createdAt,
                        sender: latestMessage.sender,
                    }
                    : null,
            };
        }));
        res.status(200).json({
            conversations: result,
        });
    }
    catch (error) {
        console.error("Get conversations error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.getMyConversations = getMyConversations;
/* =====================================================
   MARK AS READ
===================================================== */
const markConversationAsRead = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const conversationId = req.params.conversationId;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
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
        const isParticipant = conversation.participants.some((id) => id.toString() === user.id);
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        conversation.unreadCounts.set(user.id, 0);
        await conversation.save();
        res.status(200).json({
            message: "Conversation marked as read",
        });
    }
    catch (error) {
        console.error("Mark conversation as read error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.markConversationAsRead = markConversationAsRead;
/* =====================================================
   PIN / UNPIN
===================================================== */
const togglePinConversation = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const conversationId = req.params.conversationId;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
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
        const isParticipant = conversation.participants.some((id) => id.toString() === user.id);
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        const isPinned = conversation.pinnedBy.some((id) => id.toString() === user.id);
        if (isPinned) {
            conversation.pinnedBy =
                conversation.pinnedBy.filter((id) => id.toString() !== user.id);
        }
        else {
            conversation.pinnedBy.push(new mongoose_1.default.Types.ObjectId(user.id));
        }
        await conversation.save();
        res.status(200).json({
            message: isPinned
                ? "Conversation unpinned"
                : "Conversation pinned",
            pinned: !isPinned,
        });
    }
    catch (error) {
        console.error("Toggle pin error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.togglePinConversation = togglePinConversation;
/* =====================================================
   DELETE CONVERSATION
===================================================== */
const deleteConversation = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const conversationId = req.params.conversationId;
        if (!mongoose_1.default.isValidObjectId(conversationId)) {
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
        const isParticipant = conversation.participants.some((id) => id.toString() === user.id);
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        const alreadyDeleted = conversation.deletedFor.some((id) => id.toString() === user.id);
        if (!alreadyDeleted) {
            conversation.deletedFor.push(new mongoose_1.default.Types.ObjectId(user.id));
            await conversation.save();
        }
        res.status(200).json({
            message: "Conversation deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete conversation error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.deleteConversation = deleteConversation;
