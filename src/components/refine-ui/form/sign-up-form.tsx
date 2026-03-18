"use client";

import { useState } from "react";

import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadWidget from "@/components/upload-widget";
import { cn } from "@/lib/utils";
import {
  useNotification,
  useRefineOptions,
  useRegister,
} from "@refinedev/core";
import { Loader2 } from "lucide-react";

export const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "teacher" | "student">("teacher");
  const [image, setImage] = useState<string | null>(null);
  const [imageCldPubId, setImageCldPubId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const { open } = useNotification();

  // const Link = useLink();

  const { title } = useRefineOptions();

  const { mutate: register } = useRegister();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingUser(true);

    if (password !== confirmPassword) {
      open?.({
        type: "error",
        message: "Passwords don't match",
        description:
          "Please make sure both password fields contain the same value.",
      });

      return;
    }

    register({
      name,
      email,
      role,
      image: image ?? undefined,
      imageCldPubId: imageCldPubId ?? undefined,
      password,
    });

    setCreatingUser(false);
  };

  // const handleSignUpWithGoogle = () => {
  //   register({
  //     providerName: "google",
  //   });
  // };

  // const handleSignUpWithGitHub = () => {
  //   register({
  //     providerName: "github",
  //   });
  // };

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
      <div className={cn("flex", "items-center", "justify-center", "gap-2")}>
        {title.icon && (
          <div
            className={cn("text-foreground", "[&>svg]:w-12", "[&>svg]:h-12")}
          >
            {title.icon}
          </div>
        )}
      </div>

      <Card className={cn("sm:w-[456px]", "p-12", "mt-6")}>
        <CardHeader className={cn("px-0")}>
          <CardTitle
            className={cn(
              "text-green-600",
              "dark:text-green-400",
              "text-3xl",
              "font-semibold",
            )}
          >
            Sign up
          </CardTitle>
          {/* <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Welcome to lorem ipsum dolor.
          </CardDescription> */}
        </CardHeader>

        <Separator />

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleSignUp}>
            <div className={cn("flex", "flex-col", "gap-2")}>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder=""
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={cn("flex", "flex-col", "gap-2", "mt-6")}>
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

            <div className={cn("flex", "flex-col", "gap-2", "mt-6")}>
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as "admin" | "teacher" | "student")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={cn("flex", "flex-col", "gap-2")}>
              <Label className="mt-6">Profile Image</Label>
              <UploadWidget
                value={
                  image
                    ? {
                        url: image,
                        publicId: imageCldPubId ?? "",
                      }
                    : null
                }
                onChange={(value) => {
                  setImage(value?.url ?? null);
                  setImageCldPubId(value?.publicId ?? null);
                }}
              />
            </div>

            <div
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
            >
              <Label htmlFor="password">Password</Label>
              <InputPassword
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div
              className={cn("relative", "flex", "flex-col", "gap-2", "mt-6")}
            >
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <InputPassword
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className={cn(
                "w-full",
                "mt-6",
                "bg-green-600",
                "hover:bg-green-700",
                "text-white",
                "cursor-pointer"
              )}
            >
              {creatingUser ? (
                <div className="flex gap-1 items-center">
                  <span>Creating User...</span>
                  <Loader2 className="inline-block ml-2 animate-spin" />
                </div>
              ) : (
                "Create User"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

SignUpForm.displayName = "SignUpForm";
