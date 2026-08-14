import z from "zod";

export const createReviewSchema = z.object({
  serviceId: z.uuid("Invalid service id"),
  comment: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters")
    .max(1000, "Comment must not exceed 1000 characters"),
});

export const updateReviewSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(2, "Comment must be at least 2 characters")
    .max(1000, "Comment must not exceed 1000 characters"),
});

export const reviewIdParam = z.object({
  id: z.uuid("Invalid review id"),
});

export const serviceIdParam = z.object({
  serviceId: z.uuid("Invalid service id"),
});
