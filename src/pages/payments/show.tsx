import { useMemo } from "react";
import { useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ShowView } from "@/components/refine-ui/views/show-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AcademicYearRecord, FeeRecord, PaymentRecord, StudentBasic, StudentFeeRecord, TermRecord } from "@/types";
import { useBack, useList, useOne } from "@refinedev/core";

const formatCurrency = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : "$0.00";
};

const ShowPayment = () => {
  const back = useBack();
  const { id } = useParams();
  const paymentId = id ?? "";

  const { query: paymentQuery } = useOne<PaymentRecord>({
    resource: "payments",
    id: paymentId,
    queryOptions: {
      enabled: Boolean(paymentId),
    },
  });

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

  const payment = paymentQuery.data?.data ?? null;
  const students = studentsResult.data;
  const studentFees = studentFeesResult.data;
  const fees = feesResult.data;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;

  const student = useMemo(
    () => students.find((item) => item.id === payment?.studentId) ?? null,
    [payment?.studentId, students],
  );

  const studentFee = useMemo(
    () =>
      payment?.studentFeeId !== null
        ? studentFees.find((item) => item.id === payment?.studentFeeId) ?? null
        : null,
    [payment?.studentFeeId, studentFees],
  );

  const fee = useMemo(
    () => (studentFee ? fees.find((item) => item.id === studentFee.feeId) ?? null : null),
    [fees, studentFee],
  );

  const academicYear = useMemo(
    () =>
      studentFee
        ? academicYears.find((item) => item.id === studentFee.academicYearId) ?? null
        : null,
    [academicYears, studentFee],
  );

  const term = useMemo(
    () => (studentFee ? terms.find((item) => item.id === studentFee.termId) ?? null : null),
    [studentFee, terms],
  );

  if (paymentQuery.isLoading) {
    return (
      <ShowView>
        <Breadcrumb />
        <PageLoader />
      </ShowView>
    );
  }

  if (paymentQuery.isError || !payment) {
    return (
      <ShowView>
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load payment details.</p>
      </ShowView>
    );
  }

  return (
    <ShowView className="space-y-6">
      <Breadcrumb />

      <div className="intro-row">
        <h1 className="page-title">Payment Details</h1>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Transaction Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Student</p>
            <p className="font-medium">
              {student ? `${student.firstName} ${student.lastName}` : `Student #${payment.studentId}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">{formatCurrency(payment.amount)}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Payment Date</p>
            <p className="font-medium">{payment.paymentDate}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="font-medium">{payment.paymentMethod ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Reference</p>
            <p className="font-medium">{payment.reference ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Linked Fee</p>
            {studentFee && fee ? (
              <div className="space-y-1">
                <p className="font-medium">{fee.name}</p>
                <Badge variant="outline">{term?.name ?? "Unknown Term"}</Badge>
                <p className="text-xs text-muted-foreground">{academicYear?.year ?? "Unknown Year"}</p>
              </div>
            ) : (
              <Badge variant="secondary">Unallocated payment</Badge>
            )}
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="font-medium">{payment.notes ?? "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </ShowView>
  );
};

export default ShowPayment;