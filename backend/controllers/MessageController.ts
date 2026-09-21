import { Response } from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/Auth";
import { getIO } from "../socket";
// Send a new message
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { conversationId, text } = req.body as {
      conversationId: string;
      text: string;
    };

    if (!conversationId || !text) {
      res.status(400).json({
        message: "Conversation ID and message text are required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({
        message: "Invalid conversation ID",
      });
      return;
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        message: "You are not a participant in this conversation",
      });
      return;
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: text.trim(),
    });
    const otherParticipant = conversation.participants.find(
      (participant) => participant.toString() !== userId.toString()
    );

    if (otherParticipant) {
      const otherUserId = otherParticipant.toString();

      const currentUnread =
        conversation.unreadCounts?.get(otherUserId) || 0;

      conversation.unreadCounts?.set(
        otherUserId,
        currentUnread + 1
      );

      await conversation.save();
    }
    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: new Date(),
    });
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email");
    // Send to the conversation room
    getIO()
      .to(`conversation:${conversationId}`)
      .emit("newMessage", populatedMessage);

    // Send to the other participant's personal room
    if (otherParticipant) {
      getIO()
        .to(`user:${otherParticipant.toString()}`)
        .emit("newMessage", populatedMessage);
    }
    res.status(201).json({
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get messages for a conversation
export const getMessages = async (
  req: AuthRequest,
  res: Response
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

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        message: "You are not a participant in this conversation",
      });
      return;
    }

    const messages = await Message.find({
      conversation: conversationId,
    })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// Delete a message
export const deleteMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    console.log("===== DELETE CONTROLLER =====");
    console.log("req.user:", req.user);
    console.log("messageId:", req.params.messageId);
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const { messageId } = req.params;

    if (
      typeof messageId !== "string" ||
      !mongoose.isValidObjectId(messageId)
    ) {
      res.status(400).json({
        message: "Invalid message ID",
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const message = await Message.findById(messageId);

    if (!message) {
      res.status(404).json({
        message: "Message not found",
      });
      return;
    }

    // Only the sender can delete their own message
    if (message.sender.toString() !== userId.toString()) {
      res.status(403).json({
        message: "You can only delete your own messages",
      });
      return;
    }

    const conversationId = message.conversation.toString();

    await Message.findByIdAndDelete(messageId);

    // Notify everyone in the conversation
    getIO()
      .to(`conversation:${conversationId}`)
      .emit("messageDeleted", {
        messageId,
        conversationId,
      });

    res.status(200).json({
      message: "Message deleted successfully",
      messageId,
    });
  } catch (error) {
    console.error("Delete message error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
