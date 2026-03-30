import { ReportCard, UserRole } from "@/types";
import { GraduationCap, School } from "lucide-react";

import {
    BarChart3,
    BookOpen,
    BriefcaseBusiness,
    CalendarCheck2,
    ChartNoAxesCombined,
    Coins,
    FileBarChart2,
    Landmark,
    Layers,
} from "lucide-react";

export const USER_ROLES = {
    STAFF: "staff",
    TEACHER: "teacher",
    ADMIN: "admin",
};

export const ROLE_OPTIONS = [
    {
        value: USER_ROLES.STAFF,
        label: "Staff",
        icon: GraduationCap,
    },
    {
        value: USER_ROLES.TEACHER,
        label: "Teacher",
        icon: School,
    },
];

export const DEPARTMENTS = [
    "Computer Science",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "English",
    "History",
    "Geography",
    "Economics",
    "Business Administration",
    "Engineering",
    "Psychology",
    "Sociology",
    "Political Science",
    "Philosophy",
    "Education",
    "Fine Arts",
    "Music",
    "Physical Education",
    "Law",
] as const;

export const DEPARTMENT_OPTIONS = DEPARTMENTS.map((dept) => ({
    value: dept,
    label: dept,
}));

export const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB in bytes
export const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
];

const getEnvVar = (key: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
};

const normalizeApiBaseUrl = (value: string) => {
    const trimmed = value.trim().replace(/^['"]|['"]$/g, "").replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const CLOUDINARY_UPLOAD_URL = getEnvVar("VITE_CLOUDINARY_UPLOAD_URL");
export const CLOUDINARY_CLOUD_NAME = getEnvVar("VITE_CLOUDINARY_CLOUD_NAME");
export const BACKEND_BASE_URL = normalizeApiBaseUrl(getEnvVar("VITE_BACKEND_BASE_URL"));

export const BASE_URL = getEnvVar("VITE_API_URL");
export const ACCESS_TOKEN_KEY = getEnvVar("VITE_ACCESS_TOKEN_KEY");
export const REFRESH_TOKEN_KEY = getEnvVar("VITE_REFRESH_TOKEN_KEY");
export const ADMIN_PASSKEY = getEnvVar("VITE_ADMIN_PASSKEY");

export const REFRESH_TOKEN_URL = `${BASE_URL}/refresh-token`;

export const CLOUDINARY_UPLOAD_PRESET = getEnvVar("VITE_CLOUDINARY_UPLOAD_PRESET");

export const teachers = [
  { id: 1, name: "Dr. Sarah Johnson" },
  { id: 2, name: "Prof. Michael Chen" },
  { id: 3, name: "Ms. Emily Rodriguez" },
  { id: 4, name: "Mr. David Thompson" },
  { id: 5, name: "Dr. Amanda Williams" },
  { id: 6, name: "Prof. Robert Martinez" },
  { id: 7, name: "Ms. Jennifer Davis" },
  { id: 8, name: "Mr. Christopher Lee" },
  { id: 9, name: "Dr. Patricia Anderson" },
  { id: 10, name: "Prof. James Wilson" }
];

export const subjects = [
  { id: 1, name: "Mathematics", code: "MATH" },
  { id: 2, name: "Computer Science", code: "CS" },
  { id: 3, name: "English Literature", code: "ENGLIT" },
  { id: 4, name: "Physical Education", code: "PE" },
  { id: 5, name: "Biology", code: "BIO" },
  { id: 6, name: "Chemistry", code: "CHEM" },
  { id: 7, name: "Physics", code: "PHYS" },
  { id: 8, name: "World History", code: "HIST" },
  { id: 9, name: "Spanish Language", code: "SPAN" },
  { id: 10, name: "Art and Design", code: "ART" }
];

export const reports: ReportCard[] = [
    {
        title: "Class Report",
        summary:
            "Class-level summary and enrollment totals by gender, with detailed enrollment records per class.",
        category: "Academic",
        status: "guided",
        icon: Layers,
        actions: [
            { label: "Open Classes", path: "/classes" },
            { label: "Open Enrollment Details", path: "/classes/enrollments" },
        ],
        visibleTo: [UserRole.ADMIN],
    },
    {
        title: "Enrollments Report",
        summary:
            "Summary and detailed enrollment report with filters for academic year, term, and class.",
        category: "Academic",
        status: "ready",
        icon: FileBarChart2,
        actions: [{ label: "Open Enrollments", path: "/classes/enrollments" }],
        visibleTo: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
        title: "Student Attendance Report",
        summary:
            "Daily register, attendance history, and CSV export for student attendance tracking.",
        category: "Attendance",
        status: "ready",
        icon: CalendarCheck2,
        actions: [
            { label: "Open Student Attendance", path: "/classes/student-attendance" },
        ],
        visibleTo: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
        title: "Staff Attendance Report",
        summary:
            "Daily register, attendance history, and CSV export for staff attendance insights.",
        category: "Attendance",
        status: "ready",
        icon: BriefcaseBusiness,
        actions: [{ label: "Open Staff Attendance", path: "/staff/staff-attendance" }],
        visibleTo: [UserRole.ADMIN],
    },
    {
        title: "Income and Expenditure Report",
        summary:
            "Use payments and fee records to review incoming cashflow and compare against billed amounts.",
        category: "Finance",
        status: "guided",
        icon: Landmark,
        actions: [
            { label: "Open Payments", path: "/payments" },
            { label: "Open Fees", path: "/fees" },
        ],
        visibleTo: [UserRole.ADMIN],
    },
    {
        title: "Terminal Report",
        summary:
            "Use term setup and enrollment/attendance pages to analyze results for a specific term.",
        category: "Academic",
        status: "guided",
        icon: BookOpen,
        actions: [
            { label: "Open Setup (Terms)", path: "/setup" },
            { label: "Open Enrollments", path: "/classes/enrollments" },
        ],
        visibleTo: [UserRole.ADMIN, UserRole.TEACHER],
    },
    {
        title: "Subject Performance Analysis",
        summary:
            "Analyze student performance by subject from enrollment workflows and class/subject context.",
        category: "Analytics",
        status: "guided",
        icon: BarChart3,
        actions: [
            { label: "Open Subjects", path: "/subjects" },
            { label: "Open Enrollments", path: "/classes/enrollments" },
        ],
        visibleTo: [UserRole.ADMIN],
    },
    {
        title: "Revenue Report",
        summary:
            "Track total collections, payment methods, and trends from payment records.",
        category: "Finance",
        status: "ready",
        icon: Coins,
        actions: [{ label: "Open Payments", path: "/payments" }],
        visibleTo: [UserRole.ADMIN],
    },
    {
        title: "Fees Summary Report",
        summary:
            "Review fee configuration and scope by fee type, academic year, term, and class level.",
        category: "Finance",
        status: "ready",
        icon: ChartNoAxesCombined,
        actions: [{ label: "Open Fees", path: "/fees" }],
        visibleTo: [UserRole.ADMIN],
    },
];