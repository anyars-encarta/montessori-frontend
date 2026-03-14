import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
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
import { AcademicYearRecord, ClassRecord, FeeType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack, useList } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { Loader2 } from "lucide-react";
import { SubmitHandler } from "react-hook-form";
import { useMemo } from "react";
import { createFeeSchema, CreateFeeValues } from "@/validations";

const feeTypeOptions: FeeType[] = ["admission", "tuition", "feeding", "other"];

const CreateFees = () => {
  const back = useBack();

  const form = useForm<BaseRecord, HttpError, CreateFeeValues>({
    resolver: zodResolver(createFeeSchema),
    refineCoreProps: {
      resource: "fees",
      action: "create",
    },
    defaultValues: {
      name: "",
      description: "",
      amount: "",
      feeType: "tuition",
      academicYearId: "",
      applicableToLevel: "",
    },
  });

  const {
    refineCore: { onFinish },
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 200 },
  });

  const { result: classesResult } = useList<ClassRecord>({
    resource: "classes",
    pagination: { pageSize: 500 },
  });

  const academicYears = yearsResult.data;
  const classes = classesResult.data;
  const classLevels = useMemo(() => {
    return Array.from(new Set(classes.map((classRow) => classRow.level))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [classes]);

  const onSubmit: SubmitHandler<CreateFeeValues> = async (values) => {
    await onFinish({
      name: values.name.trim(),
      description: values.description.trim(),
      amount: Number.parseFloat(values.amount).toFixed(2),
      feeType: values.feeType,
      academicYearId: values.academicYearId,
      applicableToLevel: values.applicableToLevel.trim(),
    });
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Create Fee</h1>

      <div className="intro-row">
        <p>Define a new fee policy for the selected academic year.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">Fee details</CardTitle>
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
                        Fee Name <span className="text-orange-600">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Tuition Fee" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="feeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Fee Type <span className="text-orange-600">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select fee type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {feeTypeOptions.map((type) => (
                              <SelectItem key={type} value={type} className="capitalize">
                                {type}
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount <span className="text-orange-600">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ""}
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
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Academic Year <span className="text-orange-600">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year.id} value={String(year.id)}>
                                {year.year}
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
                    name="applicableToLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicable Class Level</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "all" ? "" : value)
                          }
                          value={field.value || "all"}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select class level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            {classLevels.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Optional description"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
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
                      <span>Creating Fee...</span>
                      <Loader2 className="inline-block ml-2 animate-spin" />
                    </div>
                  ) : (
                    "Create Fee"
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

export default CreateFees;