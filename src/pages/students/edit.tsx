import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import UploadWidget from "@/components/upload-widget";
import { BACKEND_BASE_URL } from "@/constants";
import {
  HealthFormValues,
  LivingWithValue,
  ParentRecord,
  PreviousSchool,
  PreviousSchoolFormValues,
  Student,
  StudentBasic,
  UploadWidgetValue,
} from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BaseRecord,
  HttpError,
  useBack,
  useList,
  useNotification,
  useOne,
} from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { SubmitHandler } from "react-hook-form";

import PageLoader from "@/components/PageLoader";
import { createStudentSchema, CreateStudentValues } from "@/validations";

const initialHealthValues: HealthFormValues = {
  diphtheria: false,
  polio: false,
  whoopingCough: false,
  tetanus: false,
  measles: false,
  tuberculosis: false,
  otherConditions: "",
  lastCheckupDate: "",
};

const initialPreviousSchoolValues: PreviousSchoolFormValues = {
  schoolName: "",
  dateOfAdmission: "",
  ageAtAdmission: "",
  dateLastAttended: "",
};

const buildApiUrl = (path: string) => {
  const normalizedBase = BACKEND_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
};

const EditStudent = () => {
  const back = useBack();
  const { open } = useNotification();
  const { id } = useParams();
  const studentId = id ?? "";

  const { query: studentQuery } = useOne<Student>({
    resource: "students",
    id: studentId,
    queryOptions: {
      enabled: Boolean(studentId),
    },
  });

  const form = useForm<BaseRecord, HttpError, CreateStudentValues>({
    resolver: zodResolver(createStudentSchema),
    refineCoreProps: {
      resource: "students",
      action: "edit",
      id: studentId,
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
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
    setValue,
    watch,
  } = form;

  const student = studentQuery.data?.data;

  const { query: parentsQuery } = useList<ParentRecord>({
    resource: "parents",
    pagination: { pageSize: 500 },
  });

  const { query: studentsQuery } = useList<StudentBasic>({
    resource: "students",
    pagination: { pageSize: 500 },
  });

  const [parentIdToAdd, setParentIdToAdd] = useState("");
  const [relationshipToAdd, setRelationshipToAdd] = useState("");
  const [siblingIdToAdd, setSiblingIdToAdd] = useState("");
  const [healthValues, setHealthValues] = useState<HealthFormValues>(initialHealthValues);
  const [livingWith, setLivingWith] = useState<LivingWithValue>("both_parents");
  const [otherDetails, setOtherDetails] = useState("");
  const [previousSchoolForm, setPreviousSchoolForm] =
    useState<PreviousSchoolFormValues>(initialPreviousSchoolValues);
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [isSavingOtherData, setIsSavingOtherData] = useState(false);
  const [isSavingPreviousSchool, setIsSavingPreviousSchool] = useState(false);

  const imageUrl = watch("cloudinaryImageUrl");
  const imagePublicId = watch("imageCldPubId");

  useEffect(() => {
    if (!student) return;

    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      gender: (student.gender as "male" | "female" | "other") ?? "male",
      admissionDate: student.admissionDate ?? "",
      dateOfBirth: student.dateOfBirth ?? "",
      registrationNumber: student.registrationNumber ?? "",
      cloudinaryImageUrl: student.cloudinaryImageUrl ?? "",
      imageCldPubId: student.imageCldPubId ?? "",
      isActive: student.isActive ?? true,
    });

    setHealthValues({
      diphtheria: student.healthDetails?.diphtheria ?? false,
      polio: student.healthDetails?.polio ?? false,
      whoopingCough: student.healthDetails?.whoopingCough ?? false,
      tetanus: student.healthDetails?.tetanus ?? false,
      measles: student.healthDetails?.measles ?? false,
      tuberculosis: student.healthDetails?.tuberculosis ?? false,
      otherConditions: student.healthDetails?.otherConditions ?? "",
      lastCheckupDate: student.healthDetails?.lastCheckupDate ?? "",
    });

    setLivingWith(
      (student.otherSignificantData?.livingWith as LivingWithValue) ?? "both_parents",
    );
    setOtherDetails(student.otherSignificantData?.otherDetails ?? "");
  }, [student, reset]);

  const availableParents = parentsQuery.data?.data ?? [];
  const availableSiblings = useMemo(() => {
    const rows = studentsQuery.data?.data ?? [];
    return rows.filter((row) => String(row.id) !== studentId);
  }, [studentsQuery.data?.data, studentId]);

  const notifySuccess = (message: string, description?: string) => {
    open?.({ type: "success", message, description });
  };

  const notifyError = (message: string, description?: string) => {
    open?.({ type: "error", message, description });
  };

  const request = async (path: string, method: "POST" | "PUT" | "DELETE", body?: object) => {
    const response = await fetch(buildApiUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }
  };

  const onSubmit: SubmitHandler<CreateStudentValues> = async (values) => {
    await onFinish({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      gender: values.gender,
      admissionDate: values.admissionDate,
      dateOfBirth: values.dateOfBirth.trim(),
      registrationNumber: values.registrationNumber.trim(),
      cloudinaryImageUrl: values.cloudinaryImageUrl.trim(),
      imageCldPubId: values.imageCldPubId.trim(),
      isActive: values.isActive,
    });

    notifySuccess("Student updated", "Basic profile details were saved.");
  };

  const handleImageChange = (value: UploadWidgetValue | null) => {
    if (!value) {
      setValue("cloudinaryImageUrl", "", { shouldDirty: true, shouldValidate: true });
      setValue("imageCldPubId", "", { shouldDirty: true, shouldValidate: true });
      return;
    }

    setValue("cloudinaryImageUrl", value.url, { shouldDirty: true, shouldValidate: true });
    setValue("imageCldPubId", value.publicId, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const refreshStudent = async () => {
    await studentQuery.refetch();
  };

  const addParent = async () => {
    const parsedParentId = Number(parentIdToAdd);
    if (!Number.isFinite(parsedParentId) || parsedParentId <= 0) {
      notifyError("Select a parent", "Please choose a valid parent record first.");
      return;
    }

    try {
      setIsSavingRelation(true);
      await request(`/students/${studentId}/parents`, "POST", {
        parentId: parsedParentId,
        relationship: relationshipToAdd.trim() || undefined,
      });
      setParentIdToAdd("");
      setRelationshipToAdd("");
      await refreshStudent();
      notifySuccess("Parent linked", "Parent was added to this student.");
    } catch (error) {
      notifyError("Failed to add parent", error instanceof Error ? error.message : undefined);
    } finally {
      setIsSavingRelation(false);
    }
  };

  const removeParent = async (parentId: number) => {
    try {
      setIsSavingRelation(true);
      await request(`/students/${studentId}/parents/${parentId}`, "DELETE");
      await refreshStudent();
      notifySuccess("Parent removed");
    } catch (error) {
      notifyError(
        "Failed to remove parent",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingRelation(false);
    }
  };

  const addSibling = async () => {
    const parsedSiblingId = Number(siblingIdToAdd);
    if (!Number.isFinite(parsedSiblingId) || parsedSiblingId <= 0) {
      notifyError("Select a sibling", "Please choose a valid student record first.");
      return;
    }

    try {
      setIsSavingRelation(true);
      await request(`/students/${studentId}/siblings`, "POST", {
        siblingId: parsedSiblingId,
      });
      setSiblingIdToAdd("");
      await refreshStudent();
      notifySuccess("Sibling linked", "Sibling relationship was added.");
    } catch (error) {
      notifyError("Failed to add sibling", error instanceof Error ? error.message : undefined);
    } finally {
      setIsSavingRelation(false);
    }
  };

  const removeSibling = async (siblingId: number) => {
    try {
      setIsSavingRelation(true);
      await request(`/students/${studentId}/siblings/${siblingId}`, "DELETE");
      await refreshStudent();
      notifySuccess("Sibling removed");
    } catch (error) {
      notifyError(
        "Failed to remove sibling",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingRelation(false);
    }
  };

  const saveHealthDetails = async () => {
    try {
      setIsSavingHealth(true);
      await request(`/students/${studentId}/health-details`, "PUT", {
        ...healthValues,
      });
      await refreshStudent();
      notifySuccess("Health details saved");
    } catch (error) {
      notifyError(
        "Failed to save health details",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingHealth(false);
    }
  };

  const saveOtherData = async () => {
    try {
      setIsSavingOtherData(true);
      await request(`/students/${studentId}/other-significant-data`, "PUT", {
        livingWith,
        otherDetails: otherDetails.trim(),
      });
      await refreshStudent();
      notifySuccess("Other significant data saved");
    } catch (error) {
      notifyError(
        "Failed to save other significant data",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingOtherData(false);
    }
  };

  const addPreviousSchool = async () => {
    if (!previousSchoolForm.schoolName.trim()) {
      notifyError("School name is required");
      return;
    }

    try {
      setIsSavingPreviousSchool(true);
      await request(`/students/${studentId}/previous-schools`, "POST", {
        schoolName: previousSchoolForm.schoolName.trim(),
        dateOfAdmission: previousSchoolForm.dateOfAdmission,
        ageAtAdmission: previousSchoolForm.ageAtAdmission,
        dateLastAttended: previousSchoolForm.dateLastAttended,
      });
      setPreviousSchoolForm(initialPreviousSchoolValues);
      await refreshStudent();
      notifySuccess("Previous school added");
    } catch (error) {
      notifyError(
        "Failed to add previous school",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingPreviousSchool(false);
    }
  };

  const removePreviousSchool = async (schoolId: number) => {
    try {
      setIsSavingPreviousSchool(true);
      await request(`/students/${studentId}/previous-schools/${schoolId}`, "DELETE");
      await refreshStudent();
      notifySuccess("Previous school removed");
    } catch (error) {
      notifyError(
        "Failed to remove previous school",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setIsSavingPreviousSchool(false);
    }
  };

  if (studentQuery.isLoading) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <PageLoader />
      </EditView>
    );
  }

  if (studentQuery.isError || !student) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load student details.</p>
        <Button onClick={back} variant="outline" type="button">
          Go Back
        </Button>
      </EditView>
    );
  }

  return (
    <EditView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Edit Student</h1>

      <div className="intro-row">
        <p>Update student profile and related records below.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 space-y-6">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">Basic student details</CardTitle>
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
                          <Input {...field} value={field.value ?? ""} />
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
                          <Input {...field} value={field.value ?? ""} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Input {...field} value={field.value ?? ""} />
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
                          Admission Date <span className="text-orange-600">*</span>
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

                <Separator />

                <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex gap-1 items-center">
                      <span>Saving Student...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Save Student"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="class-form-card w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Parents</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-3 gap-3">
              <Select value={parentIdToAdd} onValueChange={setParentIdToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={String(parent.id)}>
                      {parent.firstName} {parent.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Relationship (e.g. mother)"
                value={relationshipToAdd}
                onChange={(event) => setRelationshipToAdd(event.target.value)}
              />
              <Button type="button" onClick={addParent} disabled={isSavingRelation}>
                Add Parent
              </Button>
            </div>

            <div className="space-y-2">
              {(student.parentRelations ?? []).map((relation) => (
                <div key={relation.parentId} className="flex items-center justify-between border rounded-md p-3">
                  <span>
                    {relation.parent.firstName} {relation.parent.lastName}
                    {relation.relationship ? ` (${relation.relationship})` : ""}
                  </span>
                  <span>{relation.parent.phone}</span>
                  <span>{relation.parent.email}</span>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => removeParent(relation.parentId)}
                    disabled={isSavingRelation}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="class-form-card w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Siblings</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              <Select value={siblingIdToAdd} onValueChange={setSiblingIdToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sibling" />
                </SelectTrigger>
                <SelectContent>
                  {availableSiblings.map((sibling) => (
                    <SelectItem key={sibling.id} value={String(sibling.id)}>
                      {sibling.firstName} {sibling.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addSibling} disabled={isSavingRelation}>
                Add Sibling
              </Button>
            </div>

            <div className="space-y-2">
              {(student.siblingRelations ?? []).map((relation) => (
                <div key={relation.siblingId} className="flex items-center justify-between border rounded-md p-3">
                  <span>
                    {relation.sibling?.firstName} {relation.sibling?.lastName}
                    {" • "}
                    {relation.currentClass?.class?.name
                      ? `${relation.currentClass.class.name}${
                          relation.currentClass.academicYear?.year
                            ? ` (${relation.currentClass.academicYear.year})`
                            : ""
                        }`
                      : "Unassigned"}
                  </span>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => removeSibling(relation.siblingId)}
                    disabled={isSavingRelation}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="class-form-card w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Health Details</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              {(
                [
                  ["diphtheria", "Diphtheria"],
                  ["polio", "Polio"],
                  ["whoopingCough", "Whooping Cough"],
                  ["tetanus", "Tetanus"],
                  ["measles", "Measles"],
                  ["tuberculosis", "Tuberculosis"],
                ] as Array<[keyof HealthFormValues, string]>
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 border rounded-md p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(healthValues[key])}
                    onChange={(event) =>
                      setHealthValues((prev) => ({ ...prev, [key]: event.target.checked }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <Input
              type="date"
              value={healthValues.lastCheckupDate}
              onChange={(event) =>
                setHealthValues((prev) => ({ ...prev, lastCheckupDate: event.target.value }))
              }
            />

            <Textarea
              placeholder="Other conditions"
              value={healthValues.otherConditions}
              onChange={(event) =>
                setHealthValues((prev) => ({ ...prev, otherConditions: event.target.value }))
              }
            />

            <Button type="button" onClick={saveHealthDetails} disabled={isSavingHealth}>
              Save Health Details
            </Button>
          </CardContent>
        </Card>

        <Card className="class-form-card w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Other Significant Data</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 mt-6">
            <Select value={livingWith} onValueChange={(value) => setLivingWith(value as LivingWithValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Living with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both_parents">Both Parents</SelectItem>
                <SelectItem value="mother_only">Mother Only</SelectItem>
                <SelectItem value="father_only">Father Only</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other_person">Other Person</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Other details"
              value={otherDetails}
              onChange={(event) => setOtherDetails(event.target.value)}
            />

            <Button type="button" onClick={saveOtherData} disabled={isSavingOtherData}>
              Save Other Significant Data
            </Button>
          </CardContent>
        </Card>

        <Card className="class-form-card w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Previous Schools</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 mt-6">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                placeholder="School name"
                value={previousSchoolForm.schoolName}
                onChange={(event) =>
                  setPreviousSchoolForm((prev) => ({ ...prev, schoolName: event.target.value }))
                }
              />
              <Input
                placeholder="Age at admission"
                type="number"
                min={0}
                value={previousSchoolForm.ageAtAdmission}
                onChange={(event) =>
                  setPreviousSchoolForm((prev) => ({ ...prev, ageAtAdmission: event.target.value }))
                }
              />
              <div className="space-y-2">
                {/* <FormLabel>Date of Admission</FormLabel> */}
                <Input
                  type="date"
                  value={previousSchoolForm.dateOfAdmission}
                  onChange={(event) =>
                    setPreviousSchoolForm((prev) => ({ ...prev, dateOfAdmission: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                {/* <FormLabel>Date Last Attended</FormLabel> */}
                <Input
                  type="date"
                  value={previousSchoolForm.dateLastAttended}
                  onChange={(event) =>
                    setPreviousSchoolForm((prev) => ({ ...prev, dateLastAttended: event.target.value }))
                  }
                />
              </div>
            </div>

            <Button type="button" onClick={addPreviousSchool} disabled={isSavingPreviousSchool}>
              Add Previous School
            </Button>

            <div className="space-y-2">
              {(student.previousSchools ?? []).map((school: PreviousSchool) => (
                <div key={school.id} className="flex items-center justify-between border rounded-md p-3">
                  <span>
                    {school.schoolName}{" "}
                    {school.ageAtAdmission !== null ? ` • Age at admission ${school.ageAtAdmission}` : ""} {" "} • Admiited on {school.dateOfAdmission}
                    {school.dateLastAttended ? ` • Last attended on ${school.dateLastAttended}` : ""}
                  </span>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => removePreviousSchool(school.id)}
                    disabled={isSavingPreviousSchool}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </EditView>
  );
};

export default EditStudent;