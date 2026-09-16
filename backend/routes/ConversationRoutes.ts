        import express from "express";
        import { protect } from "../middleware/Auth";
        import {
        createOrGetConversation,
        getMyConversations,
        } from "../controllers/ConversationController";

        const router = express.Router();

        router.post("/", protect, createOrGetConversation);
    router.get("/", protect, getMyConversations);   
        export default router;