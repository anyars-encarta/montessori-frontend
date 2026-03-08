import * as z from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  level: z.string().trim().min(1, "Level is required"),
  capacity: z
    .number({
      required_error: "Capacity is required",
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

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Gender is required",
  }),
  admissionDate: z.string().trim().min(1, "Admission date is required"),
  dateOfBirth: z.string(),
  registrationNumber: z.string(),
  cloudinaryImageUrl: z.string(),
  imageCldPubId: z.string(),
  isActive: z.boolean(),
});

export type CreateStudentValues = z.infer<typeof createStudentSchema>;
