import express from "express";

import {
  register,
  login,
  verifyEmailOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/AuthController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post("/otp/verify", verifyEmailOtp);
router.post("/otp/resend", resendOtp);

export default router;