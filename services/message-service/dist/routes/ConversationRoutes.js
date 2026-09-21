"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ConversationController_1 = require("../controllers/ConversationController");
const router = express_1.default.Router();
router.post("/", ConversationController_1.createOrGetConversation);
router.get("/", ConversationController_1.getMyConversations);
router.patch("/:conversationId/read", ConversationController_1.markConversationAsRead);
router.patch("/:conversationId/pin", ConversationController_1.togglePinConversation);
router.delete("/:conversationId", ConversationController_1.deleteConversation);
exports.default = router;
