"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCalls = exports.updateCallStatus = exports.createCall = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const Call_1 = __importDefault(require("../models/Call"));
const getUserFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return null;
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return null;
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const id = decoded.id ||
            decoded.userId ||
            decoded._id;
        if (!id) {
            return null;
        }
        return {
            id,
            role: decoded.role || "user",
        };
    }
    catch {
        return null;
    }
};
/* CREATE CALL */
const createCall = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const { receiverId, type, } = req.body;
        if (!mongoose_1.default.isValidObjectId(receiverId)) {
            res.status(400).json({
                message: "Invalid receiver ID",
            });
            return;
        }
        if (type !== "audio" &&
            type !== "video") {
            res.status(400).json({
                message: "Call type must be audio or video",
            });
            return;
        }
        if (receiverId === user.id) {
            res.status(400).json({
                message: "You cannot call yourself",
            });
            return;
        }
        const call = await Call_1.default.create({
            callerId: new mongoose_1.default.Types.ObjectId(user.id),
            receiverId: new mongoose_1.default.Types.ObjectId(receiverId),
            type,
            status: "calling",
        });
        res.status(201).json({
            call,
        });
    }
    catch (error) {
        console.error("Create call error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.createCall = createCall;
/* UPDATE CALL STATUS */
const updateCallStatus = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const callId = req.params.callId;
        const { status, } = req.body;
        if (!mongoose_1.default.isValidObjectId(callId)) {
            res.status(400).json({
                message: "Invalid call ID",
            });
            return;
        }
        if (![
            "calling",
            "accepted",
            "rejected",
            "ended",
        ].includes(status)) {
            res.status(400).json({
                message: "Invalid call status",
            });
            return;
        }
        const call = await Call_1.default.findById(callId);
        if (!call) {
            res.status(404).json({
                message: "Call not found",
            });
            return;
        }
        const isParticipant = call.callerId.toString() ===
            user.id ||
            call.receiverId.toString() ===
                user.id;
        if (!isParticipant) {
            res.status(403).json({
                message: "Access denied",
            });
            return;
        }
        call.status = status;
        if (status === "accepted") {
            call.startedAt =
                new Date();
        }
        if (status === "ended") {
            call.endedAt =
                new Date();
        }
        await call.save();
        res.status(200).json({
            call,
        });
    }
    catch (error) {
        console.error("Update call status error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.updateCallStatus = updateCallStatus;
/* GET MY CALL HISTORY */
const getMyCalls = async (req, res) => {
    try {
        const user = getUserFromToken(req);
        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }
        const userId = new mongoose_1.default.Types.ObjectId(user.id);
        const calls = await Call_1.default.find({
            $or: [
                {
                    callerId: userId,
                },
                {
                    receiverId: userId,
                },
            ],
        })
            .sort({
            createdAt: -1,
        })
            .limit(50);
        res.status(200).json({
            calls,
        });
    }
    catch (error) {
        console.error("Get call history error:", error);
        res.status(500).json({
            message: "Server error",
        });
    }
};
exports.getMyCalls = getMyCalls;
exports.default = {
    createCall: exports.createCall,
    updateCallStatus: exports.updateCallStatus,
    getMyCalls: exports.getMyCalls,
};
