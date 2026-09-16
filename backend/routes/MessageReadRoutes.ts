import express from "express";

import { protect } from "../middleware/Auth";
import {
  markMessagesAsRead,
} from "../controllers/MessageReadController";

const router = express.Router();

router.patch(
  "/:conversationId/read",
  protect,
  markMessagesAsRead,
);

export default router;