import z from "zod";

// Schema for creating a service
export const createServiceSchema = z.object({
  serviceName: z
    .string()
    .min(3, "Service name must be at least 3 characters")
    .max(255, "Service name must not exceed 255 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters"),
  pricePerHour: z
    .number()
    .min(0, "Price must be greater than or equal to 0")
    .int("Price must be an integer"),
  serviceArea: z
    .array(z.string().min(1, "Service area cannot be empty"))
    .min(1, "At least one service area is required"),
  categoryId: z.uuid("Invalid category ID format"),
});

// Schema for updating a service
export const updateServiceSchema = z.object({
  serviceName: z
    .string()
    .min(3, "Service name must be at least 3 characters")
    .max(255, "Service name must not exceed 255 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  pricePerHour: z
    .number()
    .min(0, "Price must be greater than or equal to 0")
    .int("Price must be an integer")
    .optional(),
  serviceArea: z
    .array(z.string().min(1, "Service area cannot be empty"))
    .min(1, "At least one service area is required")
    .optional(),
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  isActive: z.boolean().optional(),
});

// Schema for service query parameters
export const serviceQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.string().transform(Number).optional(),
  page: z.string().transform(Number).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// service params validation
export const paramsIdSchema = z.object({
  id: z.uuid(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
