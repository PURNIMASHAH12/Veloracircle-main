import express from "express";

import {
  verifyEmailOtp,
    resendOtp,
} from "../controllers/OtpController";

import { otpLimiter } from "../middleware/RateLimiter";

const router = express.Router();

router.post(
  "/verify",
  otpLimiter,
  verifyEmailOtp
);
router.post(
  "/resend",
  otpLimiter,
  resendOtp
);

export default router;