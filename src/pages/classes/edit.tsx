import { useEffect } from "react";
import { useParams } from "react-router";

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
import { ClassEditRecord, EditClassFormValues, Staff, Subject } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BaseRecord,
  HttpError,
  useBack,
  useList,
  useOne,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { SubmitHandler } from "react-hook-form";

import { createClassSchema } from "@/validations";
import PageLoader from "@/components/PageLoader";
import { Loader2 } from "lucide-react";

const EditClass = () => {
  const back = useBack();
  const { id } = useParams();
  const classId = id ?? "";

  const { query: classQuery } = useOne<ClassEditRecord>({
    resource: "classes",
    id: classId,
    queryOptions: {
      enabled: Boolean(classId),
    },
  });

  const form = useForm<BaseRecord, HttpError, EditClassFormValues>({
    resolver: zodResolver(createClassSchema),
    refineCoreProps: {
      resource: "classes",
      action: "edit",
      id: classId,
    },
    defaultValues: {
      name: "",
      level: "",
      capacity: 0,
      supervisorId: undefined,
      subjectIds: [],
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  useEffect(() => {
    const record = classQuery.data?.data;
    if (!record) return;

    reset({
      name: record.name,
      level: record.level,
      capacity: record.capacity,
      supervisorId: record.supervisorId,
      subjectIds: record.subjects?.map((subject) => subject.subjectId) ?? [],
    });
  }, [classQuery.data?.data, reset]);

  const { query: subjectsQuery } = useList<Subject>({
    resource: "subjects",
    pagination: {
      pageSize: 200,
    },
  });

  const { query: staffQuery } = useList<Staff>({
    resource: "staff",
    pagination: {
      pageSize: 200,
    },
  });

  const subjects = subjectsQuery?.data?.data ?? [];
  const subjectsLoading = subjectsQuery?.isLoading ?? false;

  const staffMembers = staffQuery?.data?.data ?? [];
  const teachers = staffMembers.filter(
    (member) => member.staffType === "teacher",
  );
  const teachersLoading = staffQuery?.isLoading ?? false;

  const onSubmit: SubmitHandler<EditClassFormValues> = async (values) => {
    await onFinish({
      name: values.name.trim(),
      level: values.level.trim(),
      capacity: values.capacity,
      supervisorId: values.supervisorId,
      subjectIds: values.subjectIds ?? [],
    });
  };

  if (classQuery.isLoading) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <PageLoader />
      </EditView>
    );
  }

  if (classQuery.isError || !classQuery.data?.data) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <p className="text-sm text-destructive">
          Failed to load class details.
        </p>
        <Button onClick={back} variant="outline" type="button">
          Go Back
        </Button>
      </EditView>
    );
  }

  return (
    <EditView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Edit Class</h1>

      <div className="intro-row">
        <p>Update class information below.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">
              Update class details
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
                        Class Name <span className="text-orange-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Primary 1 - A"
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Level <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Primary 1"
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
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Capacity <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="30"
                            value={(field.value as number | undefined) ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? undefined : Number(value));
                            }}
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
                  name="supervisorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supervisor <span className="text-orange-600">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? String(field.value) : undefined}
                        disabled={teachersLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                teachersLoading
                                  ? "Loading teachers..."
                                  : "Select a teacher"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem
                              key={teacher.id}
                              value={String(teacher.id)}
                            >
                              {teacher.firstName} {teacher.lastName}
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
                  name="subjectIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {subjectsLoading ? (
                          <p className="text-sm text-muted-foreground">
                            Loading subjects...
                          </p>
                        ) : subjects.length ? (
                          subjects.map((subject) => {
                            const selected =
                              field.value?.includes(subject.id) ?? false;

                            return (
                              <label
                                key={subject.id}
                                htmlFor={`subject-${subject.id}`}
                                className="flex items-center gap-3 rounded-md border p-3 cursor-pointer"
                              >
                                <Checkbox
                                  id={`subject-${subject.id}`}
                                  checked={selected}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? [];

                                    if (checked) {
                                      if (!current.includes(subject.id)) {
                                        field.onChange([
                                          ...current,
                                          subject.id,
                                        ]);
                                      }
                                      return;
                                    }

                                    field.onChange(
                                      current.filter(
                                        (subjectId) => subjectId !== subject.id,
                                      ),
                                    );
                                  }}
                                />
                                <span className="text-sm">
                                  {subject.name}
                                  {subject.code ? ` (${subject.code})` : ""}
                                </span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No subjects found.
                          </p>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex gap-1 items-center">
                      <span>Updating Class...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Update Class"
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

export default EditClass;
