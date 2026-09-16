import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),

  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must not exceed 2000 characters"),
});