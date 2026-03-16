import { useEffect, useMemo, useState } from "react";

import ActionButton from "@/components/actionButton";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeeRecord, PaymentRecord, StudentBasic, StudentFeeRecord, TermRecord } from "@/types";
import { useBack, useList } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

const formatCurrency = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : "$0.00";
};

const getRemainingBalance = (studentFee?: StudentFeeRecord) => {
  if (!studentFee) return null;
  const amount = Number.parseFloat(studentFee.amount);
  const amountPaid = Number.parseFloat(studentFee.amountPaid);

  if (!Number.isFinite(amount)) return null;
  const paid = Number.isFinite(amountPaid) ? amountPaid : 0;
  return Math.max(0, amount - paid).toFixed(2);
};

const ListPayments = () => {
  const back = useBack();
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [debouncedStudentSearchQuery, setDebouncedStudentSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedStudentSearchQuery(studentSearchQuery);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [studentSearchQuery]);

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

  const { result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 500 },
  });

  const students = studentsResult.data;
  const studentFees = studentFeesResult.data;
  const fees = feesResult.data;
  const terms = termsResult.data;

  const filters = useMemo(() => {
    const values: Array<{
      field: string;
      operator: "eq" | "contains";
      value: string;
    }> = [];

    const normalizedSearch = debouncedStudentSearchQuery.trim();
    if (normalizedSearch) {
      values.push({ field: "search", operator: "contains", value: normalizedSearch });
    }

    if (startDate) {
      values.push({ field: "startDate", operator: "eq", value: startDate });
    }

    if (endDate) {
      values.push({ field: "endDate", operator: "eq", value: endDate });
    }

    return values;
  }, [debouncedStudentSearchQuery, endDate, startDate]);

  const hasActiveFilters = Boolean(studentSearchQuery.trim() || startDate || endDate);

  const paymentTable = useTable<PaymentRecord>({
    columns: useMemo<ColumnDef<PaymentRecord>[]>(
      () => [
        {
          id: "studentId",
          accessorKey: "studentId",
          size: 220,
          header: () => <p className="column-title">Student</p>,
          cell: ({ row }) => {
            const student = students.find((item) => item.id === row.original.studentId);
            const fullName = student
              ? `${student.firstName} ${student.lastName}`
              : `Student #${row.original.studentId}`;
            return <span className="font-medium">{fullName}</span>;
          },
        },
        {
          id: "studentFeeId",
          accessorKey: "studentFeeId",
          size: 220,
          header: () => <p className="column-title">Linked Fee</p>,
          cell: ({ row }) => {
            if (row.original.studentFeeId === null) {
              return <Badge variant="outline">Unallocated</Badge>;
            }

            const studentFee = studentFees.find((item) => item.id === row.original.studentFeeId);
            const fee = fees.find((item) => item.id === studentFee?.feeId);
            const term = terms.find((item) => item.id === studentFee?.termId);

            return (
              <div className="flex flex-col">
                <span className="font-medium">{fee?.name ?? `Fee #${studentFee?.feeId ?? row.original.studentFeeId}`}</span>
                <span className="text-xs text-muted-foreground">{term?.name ?? "Unknown Term"}</span>
              </div>
            );
          },
        },
        {
          id: "amount",
          accessorKey: "amount",
          size: 120,
          header: () => <p className="column-title">Amount</p>,
          cell: ({ getValue }) => <span>{formatCurrency(getValue<string>())}</span>,
        },
        {
          id: "paymentDate",
          accessorKey: "paymentDate",
          size: 120,
          header: () => <p className="column-title">Date</p>,
        },
        {
          id: "paymentMethod",
          accessorKey: "paymentMethod",
          size: 140,
          header: () => <p className="column-title">Method</p>,
          cell: ({ getValue }) => <span>{getValue<string>() || "N/A"}</span>,
        },
        {
          id: "reference",
          accessorKey: "reference",
          size: 160,
          header: () => <p className="column-title">Reference</p>,
          cell: ({ getValue }) => <span>{getValue<string>() || "N/A"}</span>,
        },
        {
          id: "remainingBalance",
          size: 150,
          header: () => <p className="column-title">Remaining Balance</p>,
          cell: ({ row }) => {
            if (row.original.studentFeeId === null) {
              return <span className="text-muted-foreground">N/A</span>;
            }

            const studentFee = studentFees.find((item) => item.id === row.original.studentFeeId);
            const remaining = getRemainingBalance(studentFee);

            return <span>{remaining ? formatCurrency(remaining) : "N/A"}</span>;
          },
        },
        {
          id: "actions",
          size: 160,
          header: () => <p className="column-title">Actions</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ShowButton resource="payments" recordItemId={row.original.id} variant="outline" size="sm">
                <ActionButton type="view" />
              </ShowButton>
              <EditButton resource="payments" recordItemId={row.original.id} variant="outline" size="sm">
                <ActionButton type="update" />
              </EditButton>
              <DeleteButton resource="payments" recordItemId={row.original.id} variant="outline" size="sm" className="cursor-pointer">
                <ActionButton type="delete" />
              </DeleteButton>
            </div>
          ),
        },
      ],
      [fees, studentFees, students, terms],
    ),
    refineCoreProps: {
      resource: "payments",
      pagination: { currentPage: 1, pageSize: 10, mode: "server" },
      filters: {
        permanent: [...filters],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  return (
    <ListView>
      <Breadcrumb />

      <div className="intro-row">
        <h1 className="page-title">Payments</h1>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <div className="intro-row">
        <p>Record and track fee payments, including part-payments against outstanding balances.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by student name or registration number"
              className="pl-10 w-full"
              value={studentSearchQuery}
              onChange={(event) => setStudentSearchQuery(event.target.value)}
            />
          </div>

          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full sm:w-[180px]" />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full sm:w-[180px]" />

          <CreateButton resource="payments" />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setStudentSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable table={paymentTable} />
    </ListView>
  );
};

export default ListPayments;