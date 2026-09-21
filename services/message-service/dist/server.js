"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
require("./models/User");
const MessageRoutes_1 = __importDefault(require("./routes/MessageRoutes"));
const ConversationRoutes_1 = __importDefault(require("./routes/ConversationRoutes"));
const ReadReceiptSocket_1 = require("./socket/ReadReceiptSocket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.use("/api/messages", MessageRoutes_1.default);
app.use("/api/conversations", ConversationRoutes_1.default);
app.get("/", (_req, res) => {
    res.json({
        message: "Velora Circle Message Service is running",
    });
});
// Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    },
});
// Socket authentication
io.use((socket, next) => {
    try {
        if (!JWT_SECRET) {
            return next(new Error("JWT_SECRET is not configured"));
        }
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const userId = decoded.id ||
            decoded.userId ||
            decoded._id;
        if (!userId) {
            return next(new Error("Invalid authentication token"));
        }
        socket.data.userId = userId;
        next();
    }
    catch {
        next(new Error("Invalid authentication token"));
    }
});
// Socket connections
io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log("Message client connected:", socket.id, "User:", userId);
    // Personal user room
    socket.join(`user:${userId}`);
    // Conversation room
    socket.on("joinConversation", (conversationId) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });
    // Read receipts
    (0, ReadReceiptSocket_1.registerReadReceiptSocket)(io, socket);
    socket.on("disconnect", () => {
        console.log("Message client disconnected:", socket.id, "User:", userId);
    });
});
// Environment validation
if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
}
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
}
// Database + server
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("Message Service MongoDB connected successfully");
    httpServer.listen(PORT, () => {
        console.log(`Message Service running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Message Service MongoDB connection failed:", error);
    process.exit(1);
});
