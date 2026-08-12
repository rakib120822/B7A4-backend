import z from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(1, "Must be at leas 1 character")
    .max(50, "Cannot exceed 50 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(5, "Password must be at least 8 characters"),
  phone: z.string().startsWith("0", "Invalid number").min(11, "Invalid number"),
  address: z.string().min(1),
});
