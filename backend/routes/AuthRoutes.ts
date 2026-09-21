import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/AuthController";

import { validate } from "../middleware/Validate";

import {
  registerSchema,
  loginSchema,
} from "../validation/AuthValidation";

import { loginLimiter } from "../middleware/RateLimiter";

const router = express.Router();

// Register
router.post(
  "/register",
  validate(registerSchema),
  register
);

// Login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);

// Forgot password
router.post(
  "/forgot-password",
  forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  resetPassword
);

export default router;