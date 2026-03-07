import * as z from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  level: z.string().trim().min(1, "Level is required"),
  capacity: z.coerce
    .number({
      invalid_type_error: "Capacity is required",
    })
    .int("Capacity must be a whole number")
    .min(0, "Capacity must be a non-negative integer"),
  supervisorId: z.coerce
    .number({
      invalid_type_error: "Supervisor is required",
    })
    .int()
    .positive("Supervisor is required"),
  subjectIds: z.array(z.number().int().positive()).optional().default([]),
});

export type CreateClassValues = z.infer<typeof createClassSchema>;