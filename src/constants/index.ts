import { GraduationCap, School } from "lucide-react";

export const USER_ROLES = {
    STUDENT: "student",
    TEACHER: "teacher",
    ADMIN: "admin",
};

export const ROLE_OPTIONS = [
    {
        value: USER_ROLES.STUDENT,
        label: "Student",
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

export const CLOUDINARY_UPLOAD_URL = getEnvVar("VITE_CLOUDINARY_UPLOAD_URL");
export const CLOUDINARY_CLOUD_NAME = getEnvVar("VITE_CLOUDINARY_CLOUD_NAME");
export const BACKEND_BASE_URL = getEnvVar("VITE_BACKEND_BASE_URL");

export const BASE_URL =  import.meta.env.VITE_API_URL;
export const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY
export const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY

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