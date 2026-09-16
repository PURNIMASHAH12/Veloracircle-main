import express from "express";
import { protect } from "../middleware/Auth";

import {
  createOrGetConversation,
  getMyConversations,
   deleteConversation,
  markConversationAsRead,
  togglePinConversation,
} from "../controllers/ConversationController";

const router = express.Router();

router.post("/", protect, createOrGetConversation);

router.get("/", protect, getMyConversations);

router.patch(
  "/:conversationId/read",
  protect,
  markConversationAsRead
);
router.patch(
  "/:conversationId/pin",
  protect,
  togglePinConversation,
);
router.delete("/:conversationId", protect, deleteConversation);
export default router;