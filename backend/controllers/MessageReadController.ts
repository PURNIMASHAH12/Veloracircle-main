import { Response } from "express";
import mongoose from "mongoose";

import Message from "../models/Message";
import { AuthRequest } from "../middleware/Auth";
import { getIO } from "../socket";

export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { conversationId } = req.params;

    if (
      typeof conversationId !== "string" ||
      !mongoose.isValidObjectId(conversationId)
    ) {
      res.status(400).json({
        message: "Invalid conversation ID",
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(
      req.user.userId,
    );

    // Find unread messages sent by other users
    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    }).select("_id sender");

    if (unreadMessages.length === 0) {
      res.status(200).json({
        message: "No unread messages",
        count: 0,
      });
      return;
    }

    const messageIds = unreadMessages.map(
      (message) => message._id,
    );

    // Mark messages as read by this user
    await Message.updateMany(
      {
        _id: { $in: messageIds },
      },
      {
        $addToSet: {
          readBy: userId,
        },
      },
    );

    // Notify the conversation that messages were read
    getIO()
      .to(`conversation:${conversationId}`)
      .emit("messagesRead", {
        conversationId,
        userId: req.user.userId,
        messageIds,
      });

    res.status(200).json({
      message: "Messages marked as read",
      count: messageIds.length,
    });
  } catch (error) {
    console.error(
      "Mark messages as read error:",
      error,
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};