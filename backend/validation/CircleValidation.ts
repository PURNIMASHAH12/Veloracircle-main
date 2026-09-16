import { z } from "zod";

export const createCircleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Circle name must be at least 2 characters")
    .max(100, "Circle name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});