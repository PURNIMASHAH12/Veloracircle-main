import { Response } from "express";
import jwt from "jsonwebtoken";

import User from "../models/User";
import Otp from "../models/Otp";
import { AuthRequest } from "../middleware/Auth";

import {
  createOtp,
  verifyOtp,
} from "../services/OtpService";

import { sendOtpEmail } from "../services/EmailService";

type OtpPurpose = "register" | "login" | "reset";

export const verifyEmailOtp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, otp, purpose } = req.body;

    if (!userId || !otp || !purpose) {
      res.status(400).json({
        message: "User ID, OTP and purpose are required",
      });
      return;
    }

    if (
      purpose !== "register" &&
      purpose !== "login" &&
      purpose !== "reset"
    ) {
      res.status(400).json({
        message: "Invalid OTP purpose",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      res.status(400).json({
        message: "OTP must be a 6-digit number",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const isValid = await verifyOtp({
      userId: user._id.toString(),
      otp,
      purpose,
    });

    if (!isValid) {
      res.status(400).json({
        message: "Invalid or expired OTP",
      });
      return;
    }

    // Registration verification
    if (purpose === "register") {
      user.emailVerified = true;
      await user.save();

      res.status(200).json({
        message: "Email verified successfully",
        verified: true,
      });

      return;
    }

    // Password reset verification
    if (purpose === "reset") {
      if (!process.env.JWT_SECRET) {
        res.status(500).json({
          message: "JWT secret is not configured",
        });
        return;
      }

      // Create a short-lived token that only allows
      // the user to reset their password.
      const resetToken = jwt.sign(
        {
          userId: user._id.toString(),
          purpose: "password-reset",
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "10m",
        }
      );

      res.status(200).json({
        message: "OTP verified successfully",
        resetToken,
      });

      return;
    }

    // Login verification
    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        message: "JWT secret is not configured",
      });
      return;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const resendOtp = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { userId, purpose } = req.body;

    if (!userId || !purpose) {
      res.status(400).json({
        message: "User ID and purpose are required",
      });
      return;
    }

    if (
      purpose !== "register" &&
      purpose !== "login" &&
      purpose !== "reset"
    ) {
      res.status(400).json({
        message: "Invalid OTP purpose",
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    // Prevent OTP resend spam.
    // A new OTP can only be requested once every 60 seconds.
    const latestOtp = await Otp.findOne({
      userId: user._id,
      purpose,
    }).sort({ createdAt: -1 });

    if (latestOtp) {
      const secondsSinceLastOtp =
        (Date.now() -
          latestOtp.createdAt.getTime()) /
        1000;

      if (secondsSinceLastOtp < 60) {
        const remainingSeconds = Math.ceil(
          60 - secondsSinceLastOtp
        );

        res.status(429).json({
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP`,
        });

        return;
      }
    }

    // Generate a new OTP.
    // createOtp() automatically invalidates
    // the previous unused OTP.
    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose,
    });

    await sendOtpEmail({
      email: user.email,
      otp,
      purpose,
    });

    res.status(200).json({
      message: "A new OTP has been sent to your email",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);

    res.status(500).json({
      message: "Unable to resend OTP",
    });
  }
};