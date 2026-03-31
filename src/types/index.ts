import { CreateClassValues, CreatePaymentValues } from "@/validations";
import { type LucideIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

export type Subject = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  cloudinaryImageUrl: string | null;
  imageCldPubId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListResponse<T = unknown> = {
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateResponse<T = unknown> = {
  data?: T;
};

export type GetOneResponse<T = unknown> = {
  data?: T;
};

declare global {
  interface CloudinaryUploadWidgetResults {
    event: string;
    info: {
      secure_url: string;
      public_id: string;
      delete_token?: string;
      resource_type: string;
      original_filename: string;
    };
  }

  interface CloudinaryWidget {
    open: () => void;
  }

  interface Window {
    cloudinary?: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (
          error: unknown,
          result: CloudinaryUploadWidgetResults,
        ) => void,
      ) => CloudinaryWidget;
    };
  }
}

export interface UploadWidgetValue {
  url: string;
  publicId: string;
}

export interface UploadWidgetProps {
  value?: UploadWidgetValue | null;
  onChange?: (value: UploadWidgetValue | null) => void;
  disabled?: boolean;
}

export enum UserRole {
  STAFF = "staff",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  imageCldPubId: string | null;
  role: UserRole | "staff";
  createdAt: string;
  updatedAt: string;
};

export type StudentBasic = {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  admissionDate: string;
  imageCldPubId: string | null;
  cloudinaryImageUrl: string | null;
  registrationNumber: string | null;
  onScholarship: boolean;
  getDiscount: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ParentRecord = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  occupation: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentParentRelation = {
  studentId: number;
  parentId: number;
  relationship: string | null;
  parent: ParentRecord;
};

export type StudentSiblingRelation = {
  studentId: number;
  siblingId: number;
  sibling: StudentBasic | null;
  currentClass?: {
    class: ClassRecord | null;
    academicYear: AcademicYearRecord | null;
    enrollmentDate: string;
  } | null;
};

export type HealthDetails = {
  id: number;
  studentId: number;
  diphtheria: boolean;
  polio: boolean;
  whoopingCough: boolean;
  tetanus: boolean;
  measles: boolean;
  tuberculosis: boolean;
  otherConditions: string | null;
  lastCheckupDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LivingWithValue =
  | "both_parents"
  | "mother_only"
  | "father_only"
  | "guardian"
  | "other_person";

export type HealthFormValues = {
  diphtheria: boolean;
  polio: boolean;
  whoopingCough: boolean;
  tetanus: boolean;
  measles: boolean;
  tuberculosis: boolean;
  otherConditions: string;
  lastCheckupDate: string;
};

export type PreviousSchoolFormValues = {
  schoolName: string;
  dateOfAdmission: string;
  ageAtAdmission: string;
  dateLastAttended: string;
};

export type LivingWith =
  | "both_parents"
  | "mother_only"
  | "father_only"
  | "guardian"
  | "other_person";

export type OtherSignificantData = {
  id: number;
  studentId: number;
  livingWith: LivingWith;
  otherDetails: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PreviousSchool = {
  id: number;
  studentId: number;
  schoolName: string;
  dateOfAdmission: string | null;
  ageAtAdmission: number | null;
  dateLastAttended: string | null;
  createdAt: string;
};

export type ClassRecord = {
  id: number;
  name: string;
  level: string;
  capacity: number;
  supervisorId: number;
  classTeacherSignatureUrl: string | null;
  subjectIds: number[];
  createdAt: string;
  updatedAt: string;
};

export type ClassStudentRow = {
  id: number;
  firstName: string;
  lastName: string;
  registrationNumber: string | null;
  cloudinaryImageUrl: string | null;
  enrollmentDate: string;
  isActive: boolean;
};

export type EditClassFormValues = Omit<CreateClassValues, "subjectIds"> & {
  subjectIds?: number[];
};

export type ClassSubjectRow = {
  classId: number;
  subjectId: number;
};

export type ClassEditRecord = {
  id: number;
  name: string;
  level: string;
  capacity: number;
  supervisorId: number;
  classTeacherSignatureUrl: string | null;
  subjects: ClassSubjectRow[];
};

export type StudentClassEnrollmentRecord = {
  id: number;
  studentId: number;
  classId: number;
  academicYearId: number;
  termId: number;
  enrollmentDate: string;
  promotionDate: string | null;
  createdAt: string;
};

export type EnrollmentWorkflowResponse = {
  success: boolean;
  data?: {
    enrollment: {
      id: number;
    };
    feesApplied: number;
    feeNamesApplied?: string[];
    subjectsApplied: number;
    feesSkippedByScholarship?: boolean;
    discountAppliedOnPromotionFees?: boolean;
  };
  error?: string;
};

export type StudentEnrollment = {
  enrollment: StudentClassEnrollmentRecord;
  class: ClassRecord | null;
  supervisor: Staff | null;
  academicYear: AcademicYearRecord | null;
};

export type StudentEnrollmentRow = {
  id: number;
  className: string;
  academicYear: string;
  term: string;
  supervisor: string;
  enrollmentDate: string;
};

export type StudentFeeRow = {
  id: number;
  feeName: string;
  amount: string;
  amountPaid: string;
  dueDate: string;
  academicYear: string;
  term: string;
  status: string;
};

export type StudentPaymentRow = {
  id: number;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  feeName: string;
  status: string;
};

export type StudentSiblingRow = {
  id: number;
  name: string;
  admissionDate: string;
  currentClass: string;
};

export type SubjectRecord = {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  cloudinaryImageUrl: string | null;
  imageCldPubId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContinuousAssessmentRecord = {
  id: number;
  studentId: number;
  subjectId: number;
  academicYearId: number;
  termId: number;
  homeWork1: string;
  homeWork2: string;
  exercise1: string;
  exercise2: string;
  classTest: string;
  classMark: string;
  examMark: string;
  totalMark: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentAssessment = {
  assessment: ContinuousAssessmentRecord;
  subject: SubjectRecord | null;
  academicYear: AcademicYearRecord | null;
  term: TermRecord | null;
};

export type PositionRecord = {
  id: number;
  studentId: number;
  classId: number;
  academicYearId: number;
  termId: number;
  position: number;
  totalScore: string;
  grade: string | null;
  remarks: string | null;
  createdAt: string;
};

export type StudentPosition = {
  position: PositionRecord;
  class: ClassRecord | null;
  academicYear: AcademicYearRecord | null;
  term: TermRecord | null;
};

export type FeeType = "admission" | "tuition" | "feeding" | "other";
export type PaymentStatus = "pending" | "partial" | "paid";

export type FeeRecord = {
  id: number;
  name: string;
  description: string | null;
  amount: string;
  feeType: FeeType;
  academicYearId: number;
  applicableTermId: number | null;
  applicableToLevel: string | null;
  applyOnce: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudentFeeRecord = {
  id: number;
  studentId: number;
  feeId: number;
  academicYearId: number;
  termId: number;
  amount: string;
  amountPaid: string;
  status: PaymentStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentFeeWithMeta = {
  studentFee: StudentFeeRecord;
  fee: FeeRecord | null;
  academicYear: AcademicYearRecord | null;
  term: TermRecord | null;
};

export type ClassDetails = {
  id: number;
  name: string;
  description: string;
  status: "active" | "inactive";
  level: string;
  capacity: number;
  classTeacherSignatureUrl: string | null;
  bannerUrl?: string;
  bannerCldPubId?: string;
  supervisorId: number;
  createdAt: string;
  updatedAt: string;
  supervisor: Staff | null;
  subjects: Array<{
    classId: number;
    subjectId: number;
    subject: Subject | null;
  }>;
  enrollments: Array<{
    enrollment: {
      id: number;
      studentId: number;
      classId: number;
      academicYearId: number;
      enrollmentDate: string;
      promotionDate: string | null;
      createdAt: string;
    };
    student: {
      id: number;
      firstName: string;
      lastName: string;
      cloudinaryImageUrl: string | null;
      registrationNumber: string | null;
    } | null;
    academicYear: {
      id: number;
      year: number;
      startDate: string;
      endDate: string;
      createdAt: string;
    } | null;
  }>;
};

export type StudentTableRow = {
  id: number;
  name: string;
  registrationNumber: string | null;
  academicYear: string;
  enrollmentDate: string;
  image: string | null;
};

export type PaymentRecord = {
  id: number;
  studentId: number;
  studentFeeId: number | null;
  amount: string;
  paymentDate: string;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: string;
};

export type StudentPayment = {
  payment: PaymentRecord;
  studentFee: StudentFeeRecord | null;
};

export type AttendanceStatus = "present" | "absent";

export type StudentAttendance = {
  id: number;
  studentId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
};

export type Student = StudentBasic & {
  parentRelations: StudentParentRelation[];
  siblingRelations: StudentSiblingRelation[];
  healthDetails: HealthDetails | null;
  otherSignificantData: OtherSignificantData | null;
  previousSchools: PreviousSchool[];
  enrollments: StudentEnrollment[];
  assessments: StudentAssessment[];
  positions: StudentPosition[];
  fees: StudentFeeWithMeta[];
  payments: StudentPayment[];
  attendances: StudentAttendance[];
  gender?: string | null;
  isActive?: boolean;
};

export type StaffGender = "male" | "female" | "other";
export type StaffType = "teacher" | "non_teaching";

export type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: StaffGender;
  staffType: StaffType;
  cloudinaryImageUrl: string | null;
  imageCldPubId: string | null;
  hireDate: string;
  registrationNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StaffSubjectAssignment = {
  staffId: number;
  subjectId: number;
  subject: SubjectRecord | null;
};

export type StaffListRecord = Staff & {
  subjects: StaffSubjectAssignment[];
  supervisedClasses: ClassRecord[];
  attendances: Array<{
    id: number;
    attendanceDate: string;
    status: AttendanceStatus;
    remarks: string | null;
  }>;
  expenses: Array<{
    expense: {
      id: number;
      amount: string;
      description: string;
      expenseDate: string;
    };
  }>;
};

export type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};

export type Department = {
  id: number;
  name: string;
  description: string;
};

export type SignUpPayload = {
  email: string;
  name: string;
  password: string;
  image?: string;
  imageCldPubId?: string;
  role: "admin" | "teacher" | "staff";
  department?: string;
};

export type WeekdayAttendancePoint = {
  date: string;
  present: boolean;
};

export type SchoolDetailsRecord = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string | null;
  logo?: string | null;
  supervisorSignatureUrl?: string | null;
  discountType: "value" | "percentage";
  discountAmount: string;
};

export type AcademicYearRecord = {
  id: number;
  year: string;
  startDate: string;
  endDate: string;
};

export type TermRecord = {
  id: number;
  name: string;
  sequenceNumber: number;
  academicYearId: number;
  startDate: string;
  endDate: string;
  holidayDates?: string[];
};

export type AcademicYearForm = {
  year: string;
  startDate: string;
  endDate: string;
};

export type TermForm = {
  name: string;
  sequenceNumber: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
  holidayDatesText: string;
};

export type EnrollmentAssessmentRow = {
  id: number;
  subjectId: number;
  subjectName: string;
  homeWork1: string;
  homeWork2: string;
  exercise1: string;
  exercise2: string;
  classTest: string;
  classMark: string;
  examMark: string;
  totalMark: string;
  grade: string | null;
  subjectPosition: string;
  remarks: string;
};

export type ClassEnrollmentOverviewRow = {
  id: number;
  student: {
    id: number;
    fullName: string;
    registrationNumber: string | null;
  };
  class: {
    id: number;
    name: string;
    level: string;
    capacity?: number;
    classTeacherSignatureUrl?: string | null;
  };
  academicYear: {
    id: number;
    year: number;
  };
  term: {
    id: number;
    name: string;
    sequenceNumber: number;
    startDate?: string;
    endDate?: string;
    nextTermStartDate?: string | null;
  };
  enrollmentDate: string;
  attendance?: string;
  classPosition: string;
  aggregate: string;
  remarks: string;
  generalComments: string | null;
  assessments: EnrollmentAssessmentRow[];
};

export type ScoreDraft = {
  homeWork1: string;
  homeWork2: string;
  exercise1: string;
  exercise2: string;
  classTest: string;
  classMark: string;
  examMark: string;
};

export type BulkEnrollmentTransitionResponse = {
  success: boolean;
  data?: {
    action: "promote" | "repeat";
    requestedCount: number;
    processedCount: number;
    successCount: number;
    failedCount: number;
    successfulEnrollmentIds: number[];
    failures: Array<{
      enrollmentId: number;
      studentId: number;
      error: string;
    }>;
  };
  error?: string;
};

export type RunGradesResponse = {
  success: boolean;
  data?: {
    gradedStudents: number;
    gradedAssessments: number;
    classLevel: string;
    mode: "upper" | "lower";
  };
  error?: string;
};

export type SchoolDetailsForm = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  supervisorSignatureUrl: string;
  discountType: "value" | "percentage";
  discountAmount: string;
};

export type DailyAttendanceRow = {
  studentId: number;
  studentName: string;
  registrationNumber: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
};

export type DailyRegisterResponse = {
  success: boolean;
  data?: DailyAttendanceRow[];
  summary?: {
    total: number;
    present: number;
    absent: number;
    unmarked: number;
  };
  error?: string;
};

export type BulkMarkResponse = {
  success: boolean;
  data?: {
    totalProcessed: number;
    inserted: number;
    updated: number;
  };
  error?: string;
};

export type AttendanceHistoryRow = {
  id: number;
  studentId: number;
  studentName: string;
  registrationNumber: string | null;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
  class: {
    id: number;
    name: string;
    level: string;
  } | null;
};

export type AttendanceHistoryResponse = {
  success: boolean;
  data?: AttendanceHistoryRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

export type StaffDailyAttendanceRow = {
  staffId: number;
  staffName: string;
  registrationNumber: string | null;
  staffType: StaffType;
  status: AttendanceStatus | null;
  remarks: string | null;
};

export type StaffDailyRegisterResponse = {
  success: boolean;
  data?: StaffDailyAttendanceRow[];
  summary?: {
    total: number;
    present: number;
    absent: number;
    unmarked: number;
  };
  error?: string;
};

export type StaffAttendanceHistoryRow = {
  id: number;
  staffId: number;
  staffName: string;
  registrationNumber: string | null;
  staffType: StaffType;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
};

export type StaffAttendanceHistoryResponse = {
  success: boolean;
  data?: StaffAttendanceHistoryRow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

export type PaymentFeeOption = {
  studentFeeId: number;
  feeName: string;
  academicYearLabel: string;
  termLabel: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: StudentFeeRecord["status"];
  label: string;
};

export type PaymentFormProps = {
  form: UseFormReturn<CreatePaymentValues>;
  onSubmit: (values: CreatePaymentValues) => Promise<void>;
  students: StudentBasic[];
  studentFees: StudentFeeRecord[];
  fees: FeeRecord[];
  academicYears: AcademicYearRecord[];
  terms: TermRecord[];
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  currentPayment?: PaymentRecord | null;
};

export type DashboardSummary = {
  totalStudents: number;
  totalActiveStudents: number;
  totalTeachers: number;
  totalNonTeachingStaff: number;
  totalClasses: number;
  maleStudents: number;
  femaleStudents: number;
  otherStudents: number;
};

export type ReportState = "ready" | "guided";

export type ReportAction = {
    label: string;
    path: string;
};

export type ReportCard = {
    title: string;
    summary: string;
    category: "Academic" | "Attendance" | "Finance" | "Analytics";
    status: ReportState;
    icon: LucideIcon;
    actions: ReportAction[];
    visibleTo: UserRole[];
};

export type PdfMode = "download" | "print";

export type GenerateEnrollmentReportPdfOptions = {
  mode?: PdfMode;
  filename?: string;
  autoClosePrintWindow?: boolean;
  printWindow?: Window | null;
};

export type StudentPdfContext = {
  fullName: string;
  registrationNumber?: string | null;
};