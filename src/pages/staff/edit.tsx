import { useEffect } from "react";
import { useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { EditView } from "@/components/refine-ui/views/edit-view";
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
import { Staff, StaffSubjectAssignment, SubjectRecord } from "@/types";
import { editStaffSchema, EditStaffValues } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack, useList, useOne } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { SubmitHandler } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

type StaffWithSubjects = Staff & {
  subjects?: StaffSubjectAssignment[];
};

const EditStaff = () => {
  const back = useBack();
  const { id } = useParams();
  const staffId = id ?? "";

  const { query: staffQuery } = useOne<StaffWithSubjects>({
    resource: "staff",
    id: staffId,
    queryOptions: {
      enabled: Boolean(staffId),
    },
  });

  const { result: staffListResult } = useList<StaffWithSubjects>({
    resource: "staff",
    pagination: { pageSize: 500 },
  });

  const { result: subjectsResult } = useList<SubjectRecord>({
    resource: "subjects",
    pagination: { pageSize: 500 },
  });

  const subjects = subjectsResult.data;

  const form = useForm<BaseRecord, HttpError, EditStaffValues>({
    resolver: zodResolver(editStaffSchema),
    refineCoreProps: {
      resource: "staff",
      action: "edit",
      id: staffId,
    },
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "male",
      staffType: "teacher",
      cloudinaryImageUrl: null,
      imageCldPubId: null,
      hireDate: "",
      registrationNumber: "",
      isActive: true,
      subjectIds: [],
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
    getValues,
    reset,
    setValue,
    watch,
  } = form;

  const selectedStaffType = watch("staffType");

  useEffect(() => {
    if (selectedStaffType !== "teacher") {
      setValue("subjectIds", []);
    }
  }, [selectedStaffType, setValue]);

  useEffect(() => {
    const staffRecord = staffQuery.data?.data;
    if (!staffRecord) return;

    const listRecord =
      staffListResult.data.find((row) => row.id === staffRecord.id) ?? null;

    reset({
      firstName: staffRecord.firstName,
      lastName: staffRecord.lastName,
      email: staffRecord.email ?? "",
      phone: staffRecord.phone ?? "",
      address: staffRecord.address ?? "",
      dateOfBirth: staffRecord.dateOfBirth ?? "",
      gender: staffRecord.gender,
      staffType: staffRecord.staffType,
      cloudinaryImageUrl: staffRecord.cloudinaryImageUrl ?? null,
      imageCldPubId: staffRecord.imageCldPubId ?? null,
      hireDate: staffRecord.hireDate,
      registrationNumber: staffRecord.registrationNumber ?? "",
      isActive: staffRecord.isActive,
      subjectIds: listRecord?.subjects?.map((row) => row.subjectId) ?? [],
    });
  }, [reset, staffQuery.data?.data, staffListResult.data]);

  const onSubmit: SubmitHandler<EditStaffValues> = async (values) => {
    await onFinish({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      address: values.address?.trim() || null,
      dateOfBirth: values.dateOfBirth?.trim() || null,
      gender: values.gender,
      staffType: values.staffType,
      cloudinaryImageUrl: values.cloudinaryImageUrl ?? null,
      imageCldPubId: values.imageCldPubId ?? null,
      hireDate: values.hireDate,
      registrationNumber: values.registrationNumber?.trim() || null,
      isActive: values.isActive,
      subjectIds: values.staffType === "teacher" ? (values.subjectIds ?? []) : [],
    });
  };

  if (staffQuery.isLoading) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <PageLoader />
      </EditView>
    );
  }

  if (staffQuery.isError || !staffQuery.data?.data) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load staff details.</p>
        <Button onClick={back} variant="outline" type="button">
          Go Back
        </Button>
      </EditView>
    );
  }

  return (
    <EditView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Edit Staff</h1>

      <div className="intro-row">
        <p>Update staff information below.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">Update staff details</CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="mt-7">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                          <Input placeholder="John" {...field} value={field.value ?? ""} />
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
                          <Input placeholder="Doe" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="johndoe@example.com"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+233..." {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, City, Country" {...field} value={field.value ?? ""} />
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
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
                    name="staffType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Staff Type <span className="text-orange-600">*</span>
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="non_teaching">Non Teaching</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Hire Date <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
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
                          <Input placeholder="STF-001" {...field} value={field.value ?? ""} />
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
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value ? "true" : "false"}
                      >
                        <FormControl>
                          <SelectTrigger>
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

                <FormField
                  control={control}
                  name="cloudinaryImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <UploadWidget
                          value={
                            field.value
                              ? {
                                  url: field.value,
                                  publicId: getValues("imageCldPubId") ?? "",
                                }
                              : null
                          }
                          onChange={(value) => {
                            field.onChange(value?.url ?? null);
                            setValue("imageCldPubId", value?.publicId ?? null, {
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

                {selectedStaffType === "teacher" && (
                  <FormField
                    control={control}
                    name="subjectIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subjects</FormLabel>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {subjects.length ? (
                            subjects.map((subject) => {
                              const selected = field.value?.includes(subject.id) ?? false;
                              return (
                                <label
                                  key={subject.id}
                                  htmlFor={`edit-staff-subject-${subject.id}`}
                                  className="flex items-center gap-3 rounded-md border p-3 cursor-pointer"
                                >
                                  <Checkbox
                                    id={`edit-staff-subject-${subject.id}`}
                                    checked={selected}
                                    onCheckedChange={(checked) => {
                                      const current = field.value ?? [];

                                      if (checked) {
                                        if (!current.includes(subject.id)) {
                                          field.onChange([...current, subject.id]);
                                        }
                                        return;
                                      }

                                      field.onChange(
                                        current.filter((id) => id !== subject.id),
                                      );
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{subject.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {subject.code ?? "No Code"}
                                    </p>
                                  </div>
                                </label>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">No subjects available.</p>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex gap-1 items-center">
                      <span>Updating Staff...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Update Staff"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </EditView>
  );
};

export default EditStaff;