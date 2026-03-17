import * as z from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (value: string) => isoDatePattern.test(value);

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
  admissionDate: z
    .string()
    .trim()
    .min(1, "Admission date is required")
    .refine(isIsoDate, "Admission date must be a valid date (YYYY-MM-DD)"),
  dateOfBirth: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  cloudinaryImageUrl: z.string().nullable(),
  imageCldPubId: z.string().nullable(),
  isActive: z.boolean(),
  onScholarship: z.boolean(),
  getDiscount: z.boolean(),
});

export type CreateStudentValues = z.infer<typeof createStudentSchema>;

const decimalStringPattern = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const isNonNegativeDecimalString = (value: string) =>
  decimalStringPattern.test(value);
const isPositiveDecimalString = (value: string) =>
  decimalStringPattern.test(value) && Number(value) > 0;

export const createFeeSchema = z.object({
  name: z.string().trim().min(1, "Fee name is required"),
  description: z.string(),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine(isNonNegativeDecimalString, "Amount must be a non-negative number"),
  feeType: z.enum(["admission", "tuition", "feeding", "other"], {
    required_error: "Fee type is required",
  }),
  academicYearId: z.string().trim().min(1, "Academic year is required"),
  applicableTermId: z.string().nullable(),
  applicableToLevel: z.string().nullable(),
  applyOnce: z.boolean(),
});

export type CreateFeeValues = z.infer<typeof createFeeSchema>;

export const editFeeSchema = z.object({
  name: z.string().trim().min(1, "Fee name is required"),
  description: z.string(),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine(isNonNegativeDecimalString, "Amount must be a non-negative number"),
  feeType: z.enum(["admission", "tuition", "feeding", "other"], {
    required_error: "Fee type is required",
  }),
  academicYearId: z.string().trim().min(1, "Academic year is required"),
  applicableTermId: z.string().nullable(),
  applicableToLevel: z.string().nullable(),
  applyOnce: z.boolean(),
});

export type EditFeeValues = z.infer<typeof editFeeSchema>;

export const createPaymentSchema = z.object({
  studentId: z.string().trim().min(1, "Student is required"),
  studentFeeId: z.string().nullable(),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine(isPositiveDecimalString, "Amount must be greater than 0"),
  paymentDate: z
    .string()
    .trim()
    .min(1, "Payment date is required")
    .refine(isIsoDate, "Payment date must be a valid date (YYYY-MM-DD)"),
  paymentMethod: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
});

export type CreatePaymentValues = z.infer<typeof createPaymentSchema>;

export const editPaymentSchema = createPaymentSchema;

export type EditPaymentValues = z.infer<typeof editPaymentSchema>;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  code: z.string(),
  description: z.string(),
  cloudinaryImageUrl: z.string().nullable(),
  imageCldPubId: z.string().nullable(),
});

export type CreateSubjectValues = z.infer<typeof createSubjectSchema>;

export const editSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  code: z.string(),
  description: z.string(),
  cloudinaryImageUrl: z.string().nullable(),
  imageCldPubId: z.string().nullable(),
});

export type EditSubjectValues = z.infer<typeof editSubjectSchema>;

export const staffGenderSchema = z.enum(["male", "female", "other"], {
  required_error: "Gender is required",
});

export const staffTypeSchema = z.enum(["teacher", "non_teaching"], {
  required_error: "Staff type is required",
});

export const createStaffSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: z
      .string()
      .trim()
      .email("Invalid email")
      .or(z.literal(""))
      .nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    dateOfBirth: z.string().nullable(),
    gender: staffGenderSchema,
    staffType: staffTypeSchema,
    cloudinaryImageUrl: z.string().nullable(),
    imageCldPubId: z.string().nullable(),
    hireDate: z
      .string()
      .trim()
      .min(1, "Hire date is required")
      .refine(isIsoDate, "Hire date must be a valid date (YYYY-MM-DD)"),
    registrationNumber: z.string().nullable(),
    isActive: z.boolean(),
    subjectIds: z.array(z.number().int().positive()).nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.staffType !== "teacher" && (value.subjectIds?.length ?? 0) > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only teachers can be assigned subjects",
        path: ["subjectIds"],
      });
    }
  });

export type CreateStaffValues = z.infer<typeof createStaffSchema>;

export const editStaffSchema = createStaffSchema;

export type EditStaffValues = z.infer<typeof editStaffSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["admin", "teacher", "student"], {
    required_error: "Role is required",
  }),
  image: z.string().nullable(),
  imageCldPubId: z.string().nullable(),
});

export type EditUserValues = z.infer<typeof editUserSchema>;
