import express from "express";

import {
  sendMessage,
  getMessages,
  deleteMessage,
} from "../controllers/MessageController";

import {
  sendFileMessage,
} from "../controllers/FileController";

import upload from "../middleware/upload";
import voiceUpload from "../middleware/voiceUpload";
import {
  sendVoiceMessage,
} from "../controllers/VoiceController";
import {
  createOrGetConversation,
  getMyConversations,
  markConversationAsRead,
  togglePinConversation,
  deleteConversation,
} from "../controllers/ConversationController";

const router = express.Router();

/* Messages */

router.post(
  "/file",
  upload.single("file"),
  sendFileMessage,
);
router.post(
  "/voice",
  voiceUpload.single("file"),
  sendVoiceMessage,
);

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