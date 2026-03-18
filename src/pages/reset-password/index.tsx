import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BACKEND_BASE_URL } from "@/constants";
import { cn } from "@/lib/utils";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(
        `${BACKEND_BASE_URL.replace(/\/+$/, "")}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token, newPassword: password }),
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { message?: string }).message ??
            "Failed to reset password. The link may have expired.",
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "px-6",
        "py-8",
        "min-h-svh",
      )}
    >
      <Card className={cn("sm:w-[456px]", "p-12", "mt-6")}>
        <CardHeader className={cn("px-0")}>
          <CardTitle
            className={cn(
              "text-blue-600",
              "dark:text-blue-400",
              "text-3xl",
              "font-semibold",
            )}
          >
            Reset password
          </CardTitle>
          <CardDescription className={cn("text-muted-foreground", "font-medium")}>
            Enter your new password below.
          </CardDescription>
        </CardHeader>

        <CardContent className={cn("px-0")}>
          {success ? (
            <div className={cn("flex", "flex-col", "gap-4")}>
              <p className={cn("text-green-600", "dark:text-green-400", "font-medium")}>
                Password reset successfully! Redirecting you to login…
              </p>
              <Button
                variant="outline"
                className={cn("w-full")}
                onClick={() => navigate("/login")}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={cn("flex", "flex-col", "gap-4")}>
                <div className={cn("flex", "flex-col", "gap-2")}>
                  <Label htmlFor="password">New Password</Label>
                  <InputPassword
                    id="password"
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className={cn("flex", "flex-col", "gap-2")}>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <InputPassword
                    id="confirmPassword"
                    placeholder="Re-enter your new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <p className={cn("text-sm", "text-red-600", "dark:text-red-400")}>
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "bg-blue-600",
                    "hover:bg-blue-700",
                    "text-white",
                    "w-full",
                    "cursor-pointer",
                  )}
                >
                  {submitting ? "Resetting…" : "Reset Password"}
                </Button>
              </div>
            </form>
          )}

          <div className={cn("mt-8")}>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={cn(
                "inline-flex",
                "items-center",
                "gap-2",
                "text-sm",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors",
                "cursor-pointer",
              )}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
