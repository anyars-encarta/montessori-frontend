"use client";

import { useState } from "react";

import { CircleHelp, Loader2 } from "lucide-react";

import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useLink, useLogin } from "@refinedev/core";

export const SignInForm = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const Link = useLink();

  const { mutateAsync: login } = useLogin();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (signingIn) return;

    setSigningIn(true);
    try {
      await login({
        email,
        password,
        rememberMe,
      });
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-between gap-8">
      <div className="w-full flex items-center justify-center p-8">
        <Card className={cn("sm:w-[456px]", "p-12", "mt-6", "sign-in-card-enter")}>
          <CardHeader className={cn("px-0", "sign-in-fade-up", "sign-in-delay-1")}>
            <CardTitle
              className={cn(
                "text-blue-600",
                "dark:text-blue-400",
                "text-3xl",
                "font-semibold"
              )}
            >
              Sign in
            </CardTitle>
            <CardDescription className={cn("text-muted-foreground", "font-medium")}>
              Welcome back
            </CardDescription>
          </CardHeader>

          <Separator className={cn("sign-in-fade-up", "sign-in-delay-2")} />

          <CardContent className={cn("px-0")}>
            <form onSubmit={handleSignIn}>
              <div className={cn("flex", "flex-col", "gap-2", "sign-in-fade-up", "sign-in-delay-3")}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div
                className={cn(
                  "relative",
                  "flex",
                  "flex-col",
                  "gap-2",
                  "mt-6",
                  "sign-in-fade-up",
                  "sign-in-delay-4"
                )}
              >
                <Label htmlFor="password">Password</Label>
                <InputPassword
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div
                className={cn(
                  "flex items-center justify-between",
                  "flex-wrap",
                  "gap-2",
                  "mt-4",
                  "sign-in-fade-up",
                  "sign-in-delay-5"
                )}
              >
                <div className={cn("flex items-center", "space-x-2")}>
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === "indeterminate" ? false : checked)
                    }
                  />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
                <Link
                  to="/forgot-password"
                  className={cn(
                    "text-sm",
                    "flex",
                    "items-center",
                    "gap-2",
                    "text-primary hover:underline",
                    "text-blue-600",
                    "dark:text-blue-400"
                  )}
                >
                  <span>Forgot password</span>
                  <CircleHelp className={cn("w-4", "h-4")} />
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={signingIn}
                className={cn(
                  "w-full",
                  "mt-6",
                  "cursor-pointer",
                  "sign-in-fade-up",
                  "sign-in-delay-6"
                )}
              >
                {signingIn ? (
                  <div className="flex gap-1 items-center">
                    <Loader2 className="inline-block ml-2 animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <img
        src="/student_image.jpg"
        height={1000}
        width={1000}
        alt="student"
        className="sign-in-hero-image sign-in-hero-image-enter"
      />
    </div>
  );
};

SignInForm.displayName = "SignInForm";
