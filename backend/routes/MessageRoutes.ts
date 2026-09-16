import express from "express";
import { protect } from "../middleware/Auth";
import {
  sendMessage,
  getMessages,
   deleteMessage,
} from "../controllers/MessageController";
import { validate } from "../middleware/Validate";
import { sendMessageSchema } from "../validation/MessageValidation";

const router = express.Router();
router.post(
  "/",
  protect,
  validate(sendMessageSchema),
  sendMessage
);
router.get("/:conversationId", protect, getMessages);
router.delete("/:messageId", protect, deleteMessage);
export default router;