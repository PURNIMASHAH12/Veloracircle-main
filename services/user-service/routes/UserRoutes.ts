import express from "express";

import {
  getUserById,
  searchUsers,
} from "../controllers/UserController";

const router = express.Router();

router.get("/search", searchUsers);
router.get("/:userId", getUserById);

export default router;