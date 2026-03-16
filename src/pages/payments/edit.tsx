import { useEffect, useMemo } from "react";
import { useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AcademicYearRecord,
  FeeRecord,
  PaymentRecord,
  StudentBasic,
  StudentFeeRecord,
  TermRecord,
} from "@/types";
import { editPaymentSchema, EditPaymentValues } from "@/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { BaseRecord, HttpError, useBack, useList, useNotification, useOne } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";

import PaymentForm, { buildPaymentFeeOptions } from "../../components/payment-form";

const EditPayment = () => {
  const back = useBack();
  const { open } = useNotification();
  const { id } = useParams();
  const paymentId = id ?? "";

  const { query: paymentQuery } = useOne<PaymentRecord>({
    resource: "payments",
    id: paymentId,
    queryOptions: {
      enabled: Boolean(paymentId),
    },
  });

  const form = useForm<BaseRecord, HttpError, EditPaymentValues>({
    resolver: zodResolver(editPaymentSchema),
    refineCoreProps: {
      resource: "payments",
      action: "edit",
      id: paymentId,
    },
    defaultValues: {
      studentId: "",
      studentFeeId: "",
      amount: "",
      paymentDate: "",
      paymentMethod: "",
      reference: "",
      notes: "",
    },
  });

  const {
    refineCore: { onFinish },
    formState: { isSubmitting },
    watch,
    reset,
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
  const payment = paymentQuery.data?.data ?? null;

  useEffect(() => {
    if (!payment) return;

    reset({
      studentId: String(payment.studentId),
      studentFeeId: payment.studentFeeId ? String(payment.studentFeeId) : "",
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod ?? "",
      reference: payment.reference ?? "",
      notes: payment.notes ?? "",
    });
  }, [payment, reset]);

  const feeOptions = useMemo(
    () =>
      buildPaymentFeeOptions({
        studentId: watch("studentId"),
        studentFees,
        fees,
        academicYears,
        terms,
        selectedStudentFeeId: watch("studentFeeId") ?? "",
        currentPaymentAmount: payment?.amount,
      }),
    [academicYears, fees, payment?.amount, studentFees, terms, watch],
  );

  const onSubmit = async (values: EditPaymentValues) => {
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

  if (paymentQuery.isLoading) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <PageLoader />
      </EditView>
    );
  }

  if (paymentQuery.isError || !payment) {
    return (
      <EditView className="class-view">
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load payment details.</p>
        <Button onClick={back} variant="outline" type="button">
          Go Back
        </Button>
      </EditView>
    );
  }

  return (
    <EditView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Edit Payment</h1>

      <div className="intro-row">
        <p>Update payment information and keep any linked fee reconciliation intact.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="my-4 flex items-center">
        <Card className="class-form-card w-full">
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl pb-0 font-bold">Update payment details</CardTitle>
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
              submitLabel="Update Payment"
              submittingLabel="Updating Payment..."
              currentPayment={payment}
            />
          </CardContent>
        </Card>
      </div>
    </EditView>
  );
};

export default EditPayment;