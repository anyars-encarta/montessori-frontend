import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadWidget from "@/components/upload-widget";
import { UploadWidgetValue } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { SubmitHandler } from "react-hook-form";
import { createStudentSchema, CreateStudentValues } from "@/validations";

const CreateStudent = () => {
  const back = useBack();

  const form = useForm<BaseRecord, HttpError, CreateStudentValues>({
    resolver: zodResolver(createStudentSchema),
    refineCoreProps: {
      resource: "students",
      action: "create",
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      admissionDate: "",
      dateOfBirth: "",
      registrationNumber: "",
      cloudinaryImageUrl: "",
      imageCldPubId: "",
      isActive: true,
      onScholarship: false,
      getDiscount: false,
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    watch,
  } = form;

  const imageUrl = watch("cloudinaryImageUrl");
  const imagePublicId = watch("imageCldPubId");
  const toNullableTrimmed = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };

  const onSubmit: SubmitHandler<CreateStudentValues> = async (values) => {
    await onFinish({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      gender: values.gender,
      admissionDate: values.admissionDate,
      dateOfBirth: toNullableTrimmed(values.dateOfBirth),
      registrationNumber: toNullableTrimmed(values.registrationNumber),
      cloudinaryImageUrl: toNullableTrimmed(values.cloudinaryImageUrl),
      imageCldPubId: toNullableTrimmed(values.imageCldPubId),
      isActive: values.isActive,
      onScholarship: values.onScholarship,
      getDiscount: values.getDiscount,
    });
  };

  const handleImageChange = (value: UploadWidgetValue | null) => {
    if (!value) {
      setValue("cloudinaryImageUrl", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("imageCldPubId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    setValue("cloudinaryImageUrl", value.url, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("imageCldPubId", value.publicId, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Create a Student</h1>

      <div className="intro-row">
        <p>Provide the required information below to add a student.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">
              Fill out the form
            </CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="mt-7">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={control}
                  name="cloudinaryImageUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Student Photo</FormLabel>
                      <FormControl>
                        <UploadWidget
                          value={
                            imageUrl
                              ? {
                                  url: imageUrl,
                                  publicId: imagePublicId || "",
                                }
                              : null
                          }
                          onChange={handleImageChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Gender <span className="text-orange-600">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="REG-2026-001"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="admissionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Admission Date{" "}
                          <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "true")
                        }
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="onScholarship"
                    render={({ field }) => (
                      <FormItem className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked === "indeterminate" ? false : checked,
                                )
                              }
                            />
                          </FormControl>
                          <FormLabel>On Scholarship</FormLabel>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          During promotions, no fees will be assigned to this
                          student.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="getDiscount"
                    render={({ field }) => (
                      <FormItem className="rounded-md border p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(
                                  checked === "indeterminate" ? false : checked,
                                )
                              }
                            />
                          </FormControl>
                          <FormLabel>Apply Discount</FormLabel>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          During promotions, recurring fees will be discounted
                          using school setup.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex gap-1 items-center">
                      <span>Creating Student...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Create Student"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
};

export default CreateStudent;
