import z, { uuid } from "zod";

export const technicianIdSchema = z.object({
  id: z.uuid("Invalid id"),
});
