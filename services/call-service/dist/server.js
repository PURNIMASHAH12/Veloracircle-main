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
require("./models/Call");
const CallRoutes_1 = __importDefault(require("./routes/CallRoutes"));
const CallSocket_1 = require("./socket/CallSocket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = process.env.PORT || 5006;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    },
});
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.status(200).send("Velora Call Service is running");
});
app.use("/api/calls", CallRoutes_1.default);
// =====================================================
// Socket authentication
// =====================================================
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
// =====================================================
// Call Socket.IO
// =====================================================
io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log("Call client connected:", socket.id, "User:", userId);
    // Private room for this user
    socket.join(`user:${userId}`);
    // Register all call signaling events
    (0, CallSocket_1.registerCallSocket)(io, socket);
    socket.on("disconnect", () => {
        console.log("Call client disconnected:", socket.id, "User:", userId);
    });
});
// =====================================================
// Database + server
// =====================================================
if (!MONGO_URI) {
    console.error("MONGO_URI is not configured");
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    process.exit(1);
}
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("Call Service MongoDB connected successfully");
    httpServer.listen(PORT, () => {
        console.log(`Call Service running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Call Service MongoDB connection error:", error);
    process.exit(1);
});
