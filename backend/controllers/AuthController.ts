import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User";
import { createOtp } from "../services/OtpService";
import { sendOtpEmail } from "../services/EmailService";

const isStrongPassword = (password: string): boolean => {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};
// Register a new user
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {

      res.status(400).json({
        message: "Name, email and password are required",
      });
      return;
    }
    if (!isStrongPassword(password)) {
      res.status(400).json({
        message:
          "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(400).json({
        message: "User already exists",
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create unverified user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified: false,
    });

    // Generate OTP
    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "register",
    });

    // Send OTP to email
    await sendOtpEmail({
      email: user.email,
      otp,
      purpose: "register",
    });

    res.status(201).json({
      message:
        "Registration successful. Please verify your email with the OTP sent to you.",
      requiresOtp: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Login user
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      res.status(400).json({
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      res.status(401).json({
        message: "Invalid email or password",
      });
      return;
    }

    // User must verify email before login
    if (!user.emailVerified) {
      res.status(403).json({
        message:
          "Please verify your email before logging in.",
        requiresEmailVerification: true,
        userId: user._id,
        email: user.email,
      });
      return;
    }

    // Generate login OTP
    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "login",
    });

    // Respond immediately so the OTP screen appears without
    // waiting for the email provider.
    res.status(200).json({
      message:
        "Password verified. OTP sent to your email.",
      requiresOtp: true,
      userId: user._id,
      email: user.email,
    });

    // Send OTP email in the background.
    // This prevents slow SMTP/email-provider response time
    // from delaying the OTP screen.
    void sendOtpEmail({
      email: user.email,
      otp,
      purpose: "login",
    }).catch((error) => {
      console.error(
        "Login OTP email error:",
        error
      );
    });

    // Do NOT generate JWT yet.
    // JWT will be generated after OTP verification.
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Request password reset
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        message: "Email is required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Do not reveal whether an email exists
    if (!user) {
      res.status(200).json({
        message:
          "If an account exists with this email, a reset OTP has been sent.",
        requiresOtp: true,
      });
      return;
    }

    // Generate reset OTP
    const { otp } = await createOtp({
      userId: user._id.toString(),
      email: user.email,
      purpose: "reset",
    });

    // Send reset OTP
    await sendOtpEmail({
      email: user.email,
      otp,
      purpose: "reset",
    });

    res.status(200).json({
      message:
        "If an account exists with this email, a reset OTP has been sent.",
      requiresOtp: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
};

// Reset password using temporary reset token
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      res.status(400).json({
        message: "Reset token and new password are required",
      });
      return;
    }

    if (!isStrongPassword(password)) {
      res.status(400).json({
        message:
          "Password must contain at least 6 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      });
      return;
    }

    if (!process.env.JWT_SECRET) {
      res.status(500).json({
        message: "JWT secret is not configured",
      });
      return;
    }

    let decoded: {
      userId: string;
      purpose: string;
    };

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      ) as {
        userId: string;
        purpose: string;
      };
    } catch {
      res.status(401).json({
        message: "Invalid or expired reset token",
      });
      return;
    }

    // Make sure this token can only be used for password reset
    if (decoded.purpose !== "password-reset") {
      res.status(401).json({
        message: "Invalid reset token",
      });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    // Hash the new password
    // Prevent using the previous password
    const isSameAsOldPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (isSameAsOldPassword) {
      res.status(400).json({
        message:
          "Your new password cannot be the same as your previous password.",
      });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      message: "Unable to reset password",
    });
  }
};