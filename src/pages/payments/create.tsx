import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";

import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AcademicYearRecord,
  FeeRecord,
  StudentBasic,
  StudentFeeRecord,
  TermRecord,
} from "@/types";
import { createPaymentSchema, CreatePaymentValues } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack, useList, useNotification } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";

import PaymentForm, { buildPaymentFeeOptions } from "../../components/payment-form";

const today = new Date().toISOString().slice(0, 10);

const CreatePayment = () => {
  const back = useBack();
  const { open } = useNotification();
  const [searchParams] = useSearchParams();

  const form = useForm<BaseRecord, HttpError, CreatePaymentValues>({
    resolver: zodResolver(createPaymentSchema),
    refineCoreProps: {
      resource: "payments",
      action: "create",
    },
    defaultValues: {
      studentId: "",
      studentFeeId: "",
      amount: "",
      paymentDate: today,
      paymentMethod: "",
      reference: "",
      notes: "",
    },
  });

  const {
    refineCore: { onFinish },
    formState: { isSubmitting },
    setValue,
    watch,
    setError,
  } = form;

  const { result: studentsResult } = useList<StudentBasic>({
    resource: "students",
    pagination: { pageSize: 1000 },
  });
  const { result: studentFeesResult } = useList<StudentFeeRecord>({
    resource: "student-fees",
    pagination: { pageSize: 2000 },
  });
  
  // Always prefill student and fee fields as soon as data loads and values are not set
  useEffect(() => {
    const studentId = searchParams.get("studentId");
    const studentFeeId = searchParams.get("studentFeeId");
    const studentsLoaded = studentsResult.data && studentsResult.data.length > 0;
    const studentFeesLoaded = studentFeesResult.data && studentFeesResult.data.length > 0;
    const currentStudentId = form.getValues("studentId");
    const currentStudentFeeId = form.getValues("studentFeeId");

    if (studentId && studentsLoaded && !currentStudentId) {
      setValue("studentId", studentId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (studentFeeId && studentFeesLoaded && !currentStudentFeeId) {
      setValue("studentFeeId", studentFeeId, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [searchParams, setValue, studentsResult.data, studentFeesResult.data, form]);

  const { result: feesResult } = useList<FeeRecord>({
    resource: "fees",
    pagination: { pageSize: 1000 },
  });
  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 500 },
  });
  const { result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 500 },
  });

  const students = studentsResult.data;
  const studentFees = studentFeesResult.data;
  const fees = feesResult.data;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;

  const feeOptions = useMemo(
    () =>
      buildPaymentFeeOptions({
        studentId: watch("studentId"),
        studentFees,
        fees,
        academicYears,
        terms,
        selectedStudentFeeId: watch("studentFeeId") ?? "",
      }),
    [academicYears, fees, studentFees, terms, watch],
  );

  const onSubmit = async (values: CreatePaymentValues) => {
    const selectedFeeOption = feeOptions.find(
      (option) => String(option.studentFeeId) === (values.studentFeeId ?? ""),
    );

    const amount = Number.parseFloat(values.amount);
    if (selectedFeeOption && amount - selectedFeeOption.remainingAmount > 0.0001) {
      const message = `Payment amount cannot exceed the outstanding balance of $${selectedFeeOption.remainingAmount.toFixed(2)}.`;
      setError("amount", { message });
      open?.({ type: "error", message: "Invalid payment amount", description: message });
      return;
    }

    await onFinish({
      studentId: values.studentId,
      studentFeeId: values.studentFeeId?.trim() || null,
      amount: Number.parseFloat(values.amount).toFixed(2),
      paymentDate: values.paymentDate,
      paymentMethod: values.paymentMethod?.trim() || null,
      reference: values.reference?.trim() || null,
      notes: values.notes?.trim() || null,
    });
  };

  return (
    <CreateView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Record Payment</h1>

      <div className="intro-row">
        <p>Create a payment and optionally attach it to a student fee for full or part-payment processing.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">Payment details</CardTitle>
          </CardHeader>

          <Separator />

          <CardContent className="mt-7">
            <PaymentForm
              form={form}
              onSubmit={onSubmit}
              students={students}
              studentFees={studentFees}
              fees={fees}
              academicYears={academicYears}
              terms={terms}
              isSubmitting={isSubmitting}
              submitLabel="Create Payment"
              submittingLabel="Creating Payment..."
            />
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
};

export default CreatePayment;