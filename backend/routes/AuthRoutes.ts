import { loginLimiter } from "../middleware/RateLimiter";
import express from "express";
import {
  register,
  login,
} from "../controllers/AuthController";

import { validate } from "../middleware/Validate";

import {
  registerSchema,
  loginSchema,
} from "../validation/AuthValidation";

const router = express.Router();

// Register
router.post(
  "/register",
  validate(registerSchema),
  register
);
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);
export default router;