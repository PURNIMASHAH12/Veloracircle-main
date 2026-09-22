import express from "express";

import {
  getAdmins,
  getUserById,
  searchUsers,
} from "../controllers/UserController";

import {
  protect,
  requireSuperadmin,
} from "../middleware/AuthMiddleware";

const router = express.Router();

router.get("/search", searchUsers);

router.get(
  "/admins",
  protect,
  requireSuperadmin,
  getAdmins,
);

router.get("/:userId", getUserById);

export default router;