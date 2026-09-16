import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/AuthRoutes";
import connectDB from "./config/db";
import userRoutes from "./routes/UserRoutes";
import circleRoutes from "./routes/CircleRoutes";
import conversationRoutes from "./routes/ConversationRoutes";
import messageRoutes from "./routes/MessageRoutes";
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors());


// Parse JSON requests
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/circles", circleRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
// Test route
app.get("/", (_req, res) => {
  res.json({
    message: "VeloraCircle backend is running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});