"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MessageController_1 = require("../controllers/MessageController");
const ConversationController_1 = require("../controllers/ConversationController");
const router = express_1.default.Router();
/* Messages */
router.post("/", MessageController_1.sendMessage);
router.get("/:conversationId", MessageController_1.getMessages);
router.delete("/:messageId", MessageController_1.deleteMessage);
/* Conversations */
router.post("/conversation", ConversationController_1.createOrGetConversation);
router.get("/conversations", ConversationController_1.getMyConversations);
router.patch("/conversations/:conversationId/read", ConversationController_1.markConversationAsRead);
router.patch("/conversations/:conversationId/pin", ConversationController_1.togglePinConversation);
router.delete("/conversations/:conversationId", ConversationController_1.deleteConversation);
exports.default = router;
