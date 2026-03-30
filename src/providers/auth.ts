import type { AuthProvider } from "@refinedev/core";
import { User, SignUpPayload } from "@/types";
import { authClient } from "@/lib/auth-client";
import { BACKEND_BASE_URL } from "@/constants";

type SessionResponse = {
  data?: {
    user?: User;
  } | null;
  error?: {
    message?: string;
  } | null;
};

const getCurrentSessionUser = async () => {
  const result = (await authClient.getSession()) as SessionResponse;
  return result?.data?.user ?? null;
};

export const authProvider: AuthProvider = {
  register: async ({
    email,
    password,
    name,
    role,
    image,
    imageCldPubId,
  }: SignUpPayload) => {
    try {
      const { data, error } = await authClient.signUp.email({
        name: name || "",
        email,
        password,
        role: role || "staff",
        image: image || "",
        imageCldPubId: imageCldPubId || "",
      });

      if (error) {
        return {
          success: false,
          error: {
            name: "Registration failed",
            message:
              error?.message || "Unable to create account. Please try again.",
          },
        };
      }

      // Store user data
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: {
          name: "Registration failed",
          message: "Unable to create account. Please try again.",
        },
      };
    }
  },
  login: async ({ email, password }) => {
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        console.error("Login error from auth client:", error);
        return {
          success: false,
          error: {
            name: "Login failed",
            message: error?.message || "Please try again later.",
          },
        };
      }

      // Store user data
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      console.error("Login exception:", error);
      return {
        success: false,
        error: {
          name: "Login failed",
          message: "Please try again later.",
        },
      };
    }
  },
  logout: async () => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        console.error("Logout error:", error);
        return {
          success: false,
          error: {
            name: "Logout failed",
            message: "Unable to log out. Please try again.",
          },
        };
      }

      localStorage.removeItem("user");
      localStorage.removeItem("accessKey");

      return {
        success: true,
        redirectTo: "/login",
      };
    } catch (error) {
      console.error("Logout exception:", error);
      return {
        success: false,
        error: {
          name: "Logout failed",
          message: "Unable to log out. Please try again.",
        },
      };
    }
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
  check: async () => {
    try {
      const user = await getCurrentSessionUser();

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        return {
          authenticated: true,
        };
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }

    localStorage.removeItem("user");
    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
      error: {
        name: "Unauthorized",
        message: "Please log in to continue.",
      },
    };
  },
  getPermissions: async () => {
    const sessionUser = await getCurrentSessionUser();

    if (sessionUser) {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      return { role: sessionUser.role };
    }

    const user = localStorage.getItem("user");
    if (!user) return null;

    try {
      const parsedUser: User = JSON.parse(user);
      return { role: parsedUser.role };
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  },
  forgotPassword: async ({ email }: { email: string }) => {
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const res = await fetch(
        `${BACKEND_BASE_URL.replace(/\/+$/, "")}/auth/request-password-reset`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, redirectTo }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          success: false,
          error: {
            name: "Forgot password failed",
            message:
              (body as { message?: string }).message ??
              "Unable to send reset email. Please try again.",
          },
        };
      }

      return { success: true };
    } catch {
      return {
        success: false,
        error: {
          name: "Forgot password failed",
          message: "Unable to send reset email. Please try again.",
        },
      };
    }
  },
  getIdentity: async () => {
    const sessionUser = await getCurrentSessionUser();

    if (sessionUser) {
      localStorage.setItem("user", JSON.stringify(sessionUser));
      return {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        image: sessionUser.image,
        role: sessionUser.role,
        imageCldPubId: sessionUser.imageCldPubId,
      };
    }

    const user = localStorage.getItem("user");
    if (!user) return null;

    try {
      const parsedUser: User = JSON.parse(user);
      return {
        id: parsedUser.id,
        name: parsedUser.name,
        email: parsedUser.email,
        image: parsedUser.image,
        role: parsedUser.role,
        imageCldPubId: parsedUser.imageCldPubId,
      };
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  },
};
