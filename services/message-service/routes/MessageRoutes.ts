import express from "express";

import {
  sendMessage,
  getMessages,
  deleteMessage,
} from "../controllers/MessageController";

import {
  createOrGetConversation,
  getMyConversations,
  markConversationAsRead,
  togglePinConversation,
  deleteConversation,
} from "../controllers/ConversationController";

const router = express.Router();

/* Messages */

router.post("/", sendMessage);

router.get(
  "/:conversationId",
  getMessages,
);

router.delete(
  "/:messageId",
  deleteMessage,
);

/* Conversations */

router.post(
  "/conversation",
  createOrGetConversation,
);

router.get(
  "/conversations",
  getMyConversations,
);

router.patch(
  "/conversations/:conversationId/read",
  markConversationAsRead,
);

router.patch(
  "/conversations/:conversationId/pin",
  togglePinConversation,
);

router.delete(
  "/conversations/:conversationId",
  deleteConversation,
);

export default router;