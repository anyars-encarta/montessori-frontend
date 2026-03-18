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

  const { mutate: login } = useLogin();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSigningIn(true);

    login({
      email,
      password,
    });

    setSigningIn(false);
  };

  return (
    <div className="flex h-screen items-center justify-between gap-8">
      <div className="w-full flex items-center justify-center p-8">
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
            Sign in
          </CardTitle>
          <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Welcome back
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleSignIn}>
            <div className={cn("flex", "flex-col", "gap-2")}>
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
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
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
                  "dark:text-blue-400",
                )}
              >
                <span>Forgot password</span>
                <CircleHelp className={cn("w-4", "h-4")} />
              </Link>
            </div>

            <Button type="submit" size="lg" className={cn("w-full", "mt-6", "cursor-pointer")}>
              {signingIn ? (
                <div className="flex gap-1 items-center">
                  <span>Signing In...</span>
                  <Loader2 className="inline-block ml-2 animate-spin" />
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
          className="sign-in-hero-image"
        />
    </div>
  );
};

SignInForm.displayName = "SignInForm";
