import { USER_ROLES } from "@/constants";
import type { User } from "@/types";

type RoleType = typeof USER_ROLES[keyof typeof USER_ROLES];

/** Reads the current user's role synchronously from localStorage. */
export const getStoredRole = (): User["role"] | undefined => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    return (JSON.parse(raw) as User).role;
  } catch {
    return undefined;
  }
};

export interface ResourceConfig {
  name: string;
  visibleTo?: RoleType[]; // if undefined, visible to all roles
}

const RESOURCE_VISIBILITY: Record<string, ResourceConfig> = {
  dashboard: {
    name: "dashboard",
    visibleTo: [USER_ROLES.STAFF, USER_ROLES.TEACHER, USER_ROLES.ADMIN],
  },
  classes: {
    name: "classes",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.TEACHER],
  },
  subjects: {
    name: "subjects",
    visibleTo: [USER_ROLES.ADMIN],
  },
  students: {
    name: "students",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.TEACHER],
  },
  "class-enrollments": {
    name: "class-enrollments",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.TEACHER],
  },
  "student-attendance": {
    name: "student-attendance",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.TEACHER],
  },
  staff: {
    name: "staff",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.STAFF],
  },
  "staff-attendance": {
    name: "staff-attendance",
    visibleTo: [USER_ROLES.ADMIN],
  },
  payments: {
    name: "payments",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.STAFF],
  },
  users: {
    name: "users",
    visibleTo: [USER_ROLES.ADMIN],
  },
  reports: {
    name: "reports",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.TEACHER],
  },
  setup: {
    name: "setup",
    visibleTo: [USER_ROLES.ADMIN],
  },
  fees: {
    name: "fees",
    visibleTo: [USER_ROLES.ADMIN, USER_ROLES.STAFF],
  },
};

/**
 * Check if a resource should be visible to a user with a specific role
 */
export const isResourceVisibleToRole = (resourceName: string, role: RoleType | undefined): boolean => {
  if (!role) return false;
  
  const config = RESOURCE_VISIBILITY[resourceName];
  
  // If no visibility config, default to showing for all authenticated users
  if (!config) return true;
  
  // If visibleTo is undefined, show to all roles
  if (!config.visibleTo) return true;
  
  return config.visibleTo.includes(role);
};

/**
 * Get all visible resource names for a specific role
 */
export const getVisibleResourceNames = (role: RoleType | undefined): string[] => {
  if (!role) return [];
  
  return Object.values(RESOURCE_VISIBILITY)
    .filter((config) => {
      if (!config.visibleTo) return true;
      return config.visibleTo.includes(role);
    })
    .map((config) => config.name);
};
