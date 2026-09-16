import express from "express";
import { protect, AuthRequest } from "../middleware/Auth";
import { requireRole } from "../middleware/Role";

const router = express.Router();

// Protected user profile
router.get("/profile", protect, (req: AuthRequest, res) => {
  res.status(200).json({
    message: "You are authenticated",
    user: req.user,
  });
});

// Admin-only route
router.get(
  "/admin-test",
  protect,
  requireRole("admin"),
  (_req: AuthRequest, res) => {
    res.status(200).json({
      message: "You have admin access",
    });
  }
);
// Search users for starting a conversation
router.get("/search", protect, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        message: "Search query is required",
      });
      return;
    }

    const User = (await import("../models/User")).default;

    const users = await User.find({
      _id: { $ne: req.user?.userId },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("_id name email")
      .limit(10);

    res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("User search error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});
export default router;