import express from "express";
import { protect } from "../middleware/Auth";
import {
  sendMessage,
  getMessages,
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
export default router;