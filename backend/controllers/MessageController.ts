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

    const { conversationId, text } = req.body;

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

    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate("conversation");
    getIO()
      .to(`conversation:${conversationId}`)
      .emit("newMessage", populatedMessage);
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

