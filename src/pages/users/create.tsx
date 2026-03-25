import { zodResolver } from "@hookform/resolvers/zod";
import { useGo } from "@refinedev/core";
import type { BaseRecord, HttpError } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import type { SubmitHandler } from "react-hook-form";

import UploadWidget from "@/components/upload-widget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { UploadWidgetValue } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { editUserSchema, type EditUserValues } from "@/validations";

const CreateUser = () => {
  const go = useGo();

  const form = useForm<BaseRecord, HttpError, EditUserValues>({
    resolver: zodResolver(editUserSchema),
    refineCoreProps: {
      resource: "users",
      action: "create",
      redirect: false,
    },
    defaultValues: {
      name: "",
      email: "",
      role: "staff",
      image: null,
      imageCldPubId: null,
      password: "",
      confirmPassword: "",
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  const roleOptions = useMemo(
    () => [
      { value: "admin", label: "Admin" },
      { value: "teacher", label: "Teacher" },
      { value: "staff", label: "Staff" },
    ] as const,
    [],
  );

  const onSubmit: SubmitHandler<EditUserValues> = async (values) => {
    await onFinish({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      role: values.role,
      image: values.image ?? null,
      imageCldPubId: values.imageCldPubId ?? null,
      password: values.password?.trim() ?? "",
      confirmPassword: values.confirmPassword?.trim() ?? "",
    });

    go({
      to: {
        resource: "users",
        action: "list",
      },
      type: "replace",
    });
  };

  return (
    <div className="my-4 flex items-center">
      <Card className="class-form-card w-full">
        <CardHeader className="relative z-10">
          <CardTitle className="pb-0 text-2xl font-bold">
            Create user account
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="mt-7">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Name <span className="text-orange-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full name"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-orange-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email address"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Role <span className="text-orange-600">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Photo</FormLabel>
                    <FormControl>
                      <UploadWidget
                        value={
                          field.value
                            ? {
                                url: field.value,
                                publicId: form.getValues("imageCldPubId") ?? "",
                              }
                            : null
                        }
                        onChange={(asset: UploadWidgetValue | null) => {
                          if (!asset) {
                            field.onChange(null);
                            form.setValue("imageCldPubId", null, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            return;
                          }

                          field.onChange(asset.url ?? null);
                          form.setValue("imageCldPubId", asset.publicId ?? null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password <span className="text-orange-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <InputPassword
                        placeholder="Enter password"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Confirm Password <span className="text-orange-600">*</span>
                    </FormLabel>
                    <FormControl>
                      <InputPassword
                        placeholder="Repeat password"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateUser;