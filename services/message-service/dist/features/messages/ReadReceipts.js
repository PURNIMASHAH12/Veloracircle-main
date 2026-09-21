"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markConversationMessagesAsRead = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Message_1 = __importDefault(require("../../models/Message"));
const markConversationMessagesAsRead = async ({ conversationId, userId, }) => {
    if (!mongoose_1.default.isValidObjectId(conversationId) ||
        !mongoose_1.default.isValidObjectId(userId)) {
        return [];
    }
    const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
    const unreadMessages = await Message_1.default.find({
        conversation: conversationId,
        sender: { $ne: userObjectId },
        readBy: { $ne: userObjectId },
    }).select("_id");
    if (unreadMessages.length === 0) {
        return [];
    }
    const messageIds = unreadMessages.map((message) => message._id.toString());
    await Message_1.default.updateMany({
        _id: {
            $in: unreadMessages.map((message) => message._id),
        },
    }, {
        $addToSet: {
            readBy: userObjectId,
        },
    });
    return messageIds;
};
exports.markConversationMessagesAsRead = markConversationMessagesAsRead;
