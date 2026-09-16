import { Response } from "express";
import mongoose from "mongoose";

import Conversation from "../models/Conversation";
import User from "../models/User";
import Message from "../models/Message";
import { AuthRequest } from "../middleware/Auth";

export const createOrGetConversation = async (
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

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        message: "User ID is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        message: "Invalid user ID",
      });
      return;
    }

    if (userId === req.user.userId) {
      res.status(400).json({
        message: "You cannot create a conversation with yourself",
      });
      return;
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    let conversation = await Conversation.findOne({
      type: "direct",
      participants: {
        $all: [
          new mongoose.Types.ObjectId(req.user.userId),
          new mongoose.Types.ObjectId(userId),
        ],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          new mongoose.Types.ObjectId(req.user.userId),
          new mongoose.Types.ObjectId(userId),
        ],
      });
    }

    res.status(200).json({
      conversation: {
        id: conversation._id,
        type: conversation.type,
      },
    });
  } catch (error) {
    console.error("Create/Get conversation error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getMyConversations = async (
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

    const conversations = await Conversation.find({
      type: "direct",
      participants: new mongoose.Types.ObjectId(req.user.userId),
      deletedFor: {
        $ne: new mongoose.Types.ObjectId(req.user.userId),
      },
    })
      .populate("participants", "name email")
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipant = conversation.participants.find(
          (participant: any) =>
            participant._id.toString() !== req.user!.userId
        ) as any;

        const latestMessage = await Message.findOne({
          conversation: conversation._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: conversation._id,
          type: conversation.type,

          unreadCount:
            conversation.unreadCounts?.get(req.user!.userId) || 0,

          pinned: conversation.pinnedBy?.some(
            (userId) =>
              userId.toString() === req.user!.userId,
          ) || false,

          otherUser: otherParticipant
            ? {
              id: otherParticipant._id,
              name: otherParticipant.name,
              email: otherParticipant.email,
            }
            : null,

          latestMessage: latestMessage
            ? {
              text: latestMessage.text,
              createdAt: latestMessage.createdAt,
              sender: latestMessage.sender,
            }
            : null,
        };
      })
    );

    res.status(200).json({
      conversations: result,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const markConversationAsRead = async (
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

    if (!mongoose.isValidObjectId(conversationId)) {
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
      (participant) =>
        participant.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        message: "You are not a participant in this conversation",
      });
      return;
    }

    conversation.unreadCounts?.set(
      req.user.userId,
      0
    );

    await conversation.save();

    res.status(200).json({
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error("Mark conversation as read error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const togglePinConversation = async (
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

    if (!mongoose.isValidObjectId(conversationId)) {
      res.status(400).json({
        message: "Invalid conversation ID",
      });
      return;
    }

    const conversation = await Conversation.findById(
      conversationId,
    );

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found",
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(
      req.user.userId,
    );

    const isParticipant = conversation.participants.some(
      (participant) =>
        participant.toString() === userId.toString(),
    );

    if (!isParticipant) {
      res.status(403).json({
        message: "You are not a participant in this conversation",
      });
      return;
    }

    const isPinned = conversation.pinnedBy?.some(
      (pinnedUserId) =>
        pinnedUserId.toString() === userId.toString(),
    );

    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        (pinnedUserId) =>
          pinnedUserId.toString() !== userId.toString(),
      );
    } else {
      conversation.pinnedBy.push(userId);
    }

    await conversation.save();

    res.status(200).json({
      message: isPinned
        ? "Conversation unpinned"
        : "Conversation pinned",
      pinned: !isPinned,
    });
  } catch (error) {
    console.error("Toggle pin conversation error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
export const deleteConversation = async (
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

    if (!mongoose.isValidObjectId(conversationId)) {
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
      (participant) =>
        participant.toString() === userId.toString()
    );

    if (!isParticipant) {
      res.status(403).json({
        message: "You are not a participant in this conversation",
      });
      return;
    }

    const alreadyDeleted = conversation.deletedFor.some(
      (user) => user.toString() === userId.toString()
    );

    if (!alreadyDeleted) {
      conversation.deletedFor.push(userId);
      await conversation.save();
    }

    res.status(200).json({
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};