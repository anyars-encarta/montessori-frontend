import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  AcademicYearRecord,
  FeeRecord,
  PaymentFeeOption,
  PaymentFormProps,
  StudentBasic,
  StudentFeeRecord,
  TermRecord,
} from "@/types";
import { Loader2 } from "lucide-react";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const paymentMethodOptions = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

const formatStudentLabel = (student: StudentBasic) => {
  const fullName = `${student.firstName} ${student.lastName}`;
  return student.registrationNumber
    ? `${fullName} (${student.registrationNumber})`
    : fullName;
};

export const buildPaymentFeeOptions = ({
  studentId,
  studentFees,
  fees,
  academicYears,
  terms,
  selectedStudentFeeId,
  currentPaymentAmount,
}: {
  studentId: string;
  studentFees: StudentFeeRecord[];
  fees: FeeRecord[];
  academicYears: AcademicYearRecord[];
  terms: TermRecord[];
  selectedStudentFeeId: string;
  currentPaymentAmount?: string;
}): PaymentFeeOption[] => {
  const selectedStudentId = Number.parseInt(studentId, 10);
  const selectedFeeId = Number.parseInt(selectedStudentFeeId, 10);
  const existingPaymentAmount = Number.parseFloat(currentPaymentAmount ?? "0");

  if (!Number.isFinite(selectedStudentId)) {
    return [];
  }

  return studentFees
    .filter((studentFee) => studentFee.studentId === selectedStudentId)
    .map((studentFee) => {
      const fee = fees.find((item) => item.id === studentFee.feeId);
      const academicYear = academicYears.find(
        (item) => item.id === studentFee.academicYearId,
      );
      const term = terms.find((item) => item.id === studentFee.termId);

      const parsedTotalAmount = Number.parseFloat(studentFee.amount);
      const parsedRecordedAmountPaid = Number.parseFloat(studentFee.amountPaid);
      const totalAmount = Number.isFinite(parsedTotalAmount)
        ? parsedTotalAmount
        : 0;
      const recordedAmountPaid = Number.isFinite(parsedRecordedAmountPaid)
        ? parsedRecordedAmountPaid
        : 0;
      const adjustedAmountPaid =
        Number.isFinite(selectedFeeId) && studentFee.id === selectedFeeId
          ? Math.max(
              0,
              recordedAmountPaid -
                (Number.isFinite(existingPaymentAmount)
                  ? existingPaymentAmount
                  : 0),
            )
          : recordedAmountPaid;
      const remainingAmount = Math.max(0, totalAmount - adjustedAmountPaid);

      return {
        studentFeeId: studentFee.id,
        feeName: fee?.name ?? `Fee #${studentFee.feeId}`,
        academicYearLabel:
          academicYear?.year ?? `Year #${studentFee.academicYearId}`,
        termLabel: term?.name ?? `Term #${studentFee.termId}`,
        totalAmount,
        amountPaid: adjustedAmountPaid,
        remainingAmount,
        status: studentFee.status,
        label: `${fee?.name ?? `Fee #${studentFee.feeId}`} • ${
          term?.name ?? "Unknown Term"
        } • Remaining ${formatCurrency(remainingAmount)}`,
      } satisfies PaymentFeeOption;
    })
    .filter(
      (option) =>
        option.remainingAmount > 0 ||
        option.studentFeeId ===
          (Number.isFinite(selectedFeeId) ? selectedFeeId : -1),
    )
    .sort((a, b) => a.feeName.localeCompare(b.feeName));
};

const PaymentForm = ({
  form,
  onSubmit,
  students,
  studentFees,
  fees,
  academicYears,
  terms,
  isSubmitting,
  submitLabel,
  submittingLabel,
  currentPayment,
}: PaymentFormProps) => {
  const { control, handleSubmit, setValue, watch } = form;
  const [studentQuery, setStudentQuery] = useState("");

  const selectedStudentId = watch("studentId");
  const selectedStudentFeeId = watch("studentFeeId");

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const registration = (student.registrationNumber ?? "").toLowerCase();

      return fullName.includes(query) || registration.includes(query);
    });
  }, [studentQuery, students]);

  const studentOptions = useMemo(() => {
    const selected = students.find(
      (student) => String(student.id) === (selectedStudentId ?? ""),
    );

    if (!selected) {
      return filteredStudents;
    }

    const selectedInFiltered = filteredStudents.some(
      (student) => student.id === selected.id,
    );

    return selectedInFiltered
      ? filteredStudents
      : [selected, ...filteredStudents];
  }, [filteredStudents, selectedStudentId, students]);

  const feeOptions = useMemo(
    () =>
      buildPaymentFeeOptions({
        studentId: selectedStudentId,
        studentFees,
        fees,
        academicYears,
        terms,
        selectedStudentFeeId: selectedStudentFeeId ?? "",
        currentPaymentAmount: currentPayment?.amount,
      }),
    [
      academicYears,
      currentPayment?.amount,
      fees,
      selectedStudentFeeId,
      selectedStudentId,
      studentFees,
      terms,
    ],
  );

  const selectedFeeOption = feeOptions.find(
    (option) => String(option.studentFeeId) === (selectedStudentFeeId ?? ""),
  );

  useEffect(() => {
    if (!selectedStudentFeeId) {
      return;
    }

    const exists = feeOptions.some(
      (option) => String(option.studentFeeId) === selectedStudentFeeId,
    );

    if (!exists) {
      setValue("studentFeeId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [feeOptions, selectedStudentFeeId, setValue]);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Student <span className="text-orange-600">*</span>
                </FormLabel>
                <Input
                  type="text"
                  placeholder="Search student by name or registration number"
                  value={studentQuery}
                  onChange={(event) => setStudentQuery(event.target.value)}
                />
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {studentOptions.map((student) => (
                      <SelectItem key={student.id} value={String(student.id)}>
                        {formatStudentLabel(student)}
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
            name="studentFeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Fee</FormLabel>
                <Select
                  value={field.value || "unallocated"}
                  onValueChange={(value) =>
                    field.onChange(value === "unallocated" ? "" : value)
                  }
                  disabled={!selectedStudentId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a fee to pay" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="unallocated">
                      Unallocated payment
                    </SelectItem>
                    {feeOptions.map((option) => (
                      <SelectItem
                        key={option.studentFeeId}
                        value={String(option.studentFeeId)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedFeeOption && (
          <Card>
            <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Fee</p>
                <p className="font-medium">{selectedFeeOption.feeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Academic Period</p>
                <p className="font-medium">
                  {selectedFeeOption.academicYearLabel} /{" "}
                  {selectedFeeOption.termLabel}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="font-medium">
                  {formatCurrency(selectedFeeOption.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Outstanding Balance
                </p>
                <p className="font-medium">
                  {formatCurrency(selectedFeeOption.remainingAmount)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
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
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                {selectedFeeOption ? (
                  <p className="text-xs text-muted-foreground">
                    You can record a part-payment up to{" "}
                    {formatCurrency(selectedFeeOption.remainingAmount)}.
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Payment Date <span className="text-orange-600">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select
                  value={field.value || "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? "" : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {paymentMethodOptions.map((option) => (
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
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Receipt / Transaction reference"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional payment notes"
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
              <span>{submittingLabel}</span>
              <Loader2 className="inline-block ml-2 animate-spin" />
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
};

export default PaymentForm;
