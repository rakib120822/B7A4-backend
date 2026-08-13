import z from "zod";

export const bookingSchema = z
  .object({
    serviceId: z.uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRM", "ACCEPTED", "CANCELED"]),
});
