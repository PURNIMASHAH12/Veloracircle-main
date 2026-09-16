import { Response } from "express";
import Circle from "../models/Circle";
import { AuthRequest } from "../middleware/Auth";

// Create a Circle
export const createCircle = async (
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

    const { name, description } = req.body;

    const circle = await Circle.create({
      name,
      description,
      createdBy: req.user.userId,
      members: [req.user.userId],
    });

    res.status(201).json({
      message: "Circle created successfully",
      circle: {
        id: circle._id,
        name: circle.name,
        description: circle.description,
      },
    });
  } catch (error) {
    console.error("Create Circle error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// Get Circle members - Admin only
export const getCircleMembers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const circle = await Circle.findById(req.params.circleId)
      .populate("members", "name email role");

    if (!circle) {
      res.status(404).json({
        message: "Circle not found",
      });
      return;
    }

    res.status(200).json({
      circleId: circle._id,
      members: circle.members,
    });
  } catch (error) {
    console.error("Get Circle members error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// Add a member to a Circle - Admin only
export const addCircleMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const circle = await Circle.findById(req.params.circleId);

    if (!circle) {
      res.status(404).json({ message: "Circle not found" });
      return;
    }

    const alreadyMember = circle.members.some(
      (member) => member.toString() === userId
    );

    if (alreadyMember) {
      res.status(400).json({
        message: "User is already a member of this Circle",
      });
      return;
    }

    const User = (await import("../models/User")).default;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    circle.members.push(user._id);
    await circle.save();

    res.status(200).json({
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("Add Circle member error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Remove a member from a Circle - Admin only
export const removeCircleMember = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    const circle = await Circle.findById(req.params.circleId);

    if (!circle) {
      res.status(404).json({ message: "Circle not found" });
      return;
    }

    const isMember = circle.members.some(
      (member) => member.toString() === userId
    );

    if (!isMember) {
      res.status(404).json({
        message: "User is not a member of this Circle",
      });
      return;
    }

    circle.members = circle.members.filter(
      (member) => member.toString() !== userId
    );

    await circle.save();

    res.status(200).json({
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Circle member error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Get Circle details - Members only
export const getCircle = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const circle = await Circle.findById(req.params.circleId);

    if (!circle) {
      res.status(404).json({ message: "Circle not found" });
      return;
    }

    const isMember = circle.members.some(
      (member) => member.toString() === req.user!.userId
    );

    if (!isMember) {
      res.status(403).json({
        message: "You are not a member of this Circle",
      });
      return;
    }

    res.status(200).json({
      circle: {
        id: circle._id,
        name: circle.name,
        description: circle.description,
      },
    });
  } catch (error) {
    console.error("Get Circle error:", error);
    res.status(500).json({ message: "Server error" });
  }
};