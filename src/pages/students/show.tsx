import { useNotification, useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

import { BACKEND_BASE_URL } from "@/constants";
import {
  generateEnrollmentTerminalReportPdf,
  generateStudentFeeReportPdf,
  generateStudentPaymentReportPdf,
} from "@/lib/enrollment-terminal-report-pdf";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Student,
  ClassEnrollmentOverviewRow,
  SchoolDetailsRecord,
  StudentEnrollmentRow,
  StudentFeeRow,
  StudentPaymentRow,
  StudentSiblingRow,
} from "@/types";
import PageLoader from "@/components/PageLoader";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import ActionButton from "@/components/actionButton";
import { Button } from "@/components/ui/button";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const buildApiUrl = (path: string) => {
  const normalizedBase = BACKEND_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const healthIndicators: Array<{
  key:
    | "diphtheria"
    | "polio"
    | "whoopingCough"
    | "tetanus"
    | "measles"
    | "tuberculosis";
  label: string;
}> = [
  { key: "diphtheria", label: "Diphtheria" },
  { key: "polio", label: "Polio" },
  { key: "whoopingCough", label: "Whooping Cough" },
  { key: "tetanus", label: "Tetanus" },
  { key: "measles", label: "Measles" },
  { key: "tuberculosis", label: "Tuberculosis" },
];

const ShowStudent = () => {
  const { id } = useParams();
  const studentId = id ?? "";
  const navigate = useNavigate();
  const { open } = useNotification();

  const { query } = useShow<Student>({
    resource: "students",
    id: studentId,
  });

  const student = query.data?.data;

  const getStudentPrintContext = useCallback(
    () => ({
      fullName:
        `${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim() ||
        "Student",
      registrationNumber: student?.registrationNumber ?? null,
    }),
    [student?.firstName, student?.lastName, student?.registrationNumber],
  );

  const loadSchoolDetails = useCallback(async () => {
    let school: SchoolDetailsRecord | null = null;
    try {
      const schoolResponse = await fetch(buildApiUrl("/school-details"), {
        credentials: "include",
      });

      if (schoolResponse.ok) {
        const schoolPayload = (await schoolResponse.json()) as {
          success?: boolean;
          data?: SchoolDetailsRecord[];
        };
        school = schoolPayload.data?.[0] ?? null;
      }
    } catch {
      // Report rendering should continue even if school details cannot be fetched.
    }

    return school;
  }, []);

  const loadEnrollmentReport = useCallback(
    async (enrollmentId: number) => {
      const response = await fetch(
        buildApiUrl(
          `/student-class-enrollments/overview?enrollmentId=${enrollmentId}&limit=1`,
        ),
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(
          payload.error ??
            payload.message ??
            "Failed to fetch enrollment report",
        );
      }

      const payload = (await response.json()) as {
        success?: boolean;
        data?: ClassEnrollmentOverviewRow[];
      };

      const report = payload.data?.[0];
      if (!report) {
        throw new Error("No terminal report data found for this enrollment.");
      }

      const school = await loadSchoolDetails();

      return { report, school };
    },
    [loadSchoolDetails],
  );

  const printEnrollmentReport = useCallback(
    async (enrollmentId: number) => {
      const printWindow = window.open(
        "",
        "_blank",
        "noopener,noreferrer,width=1024,height=768",
      );

      if (!printWindow) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "Pop-up blocked. Please allow pop-ups and try again.",
        });
        return;
      }

      try {
        const { report, school } = await loadEnrollmentReport(enrollmentId);

        await generateEnrollmentTerminalReportPdf(report, school, {
          mode: "print",
          autoClosePrintWindow: true,
          printWindow,
        });
      } catch (error) {
        if (!printWindow.closed) {
          printWindow.close();
        }

        open?.({
          type: "error",
          message: "Print failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to print terminal report.",
        });
      }
    },
    [loadEnrollmentReport, open],
  );

  const printFeeReport = useCallback(
    async (fee: StudentFeeRow) => {
      const printWindow = window.open(
        "",
        "_blank",
        "noopener,noreferrer,width=1024,height=768",
      );

      if (!printWindow) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "Pop-up blocked. Please allow pop-ups and try again.",
        });
        return;
      }

      try {
        const school = await loadSchoolDetails();
        await generateStudentFeeReportPdf(
          fee,
          getStudentPrintContext(),
          school,
          {
            mode: "print",
            autoClosePrintWindow: true,
            printWindow,
          },
        );
      } catch (error) {
        if (!printWindow.closed) {
          printWindow.close();
        }

        open?.({
          type: "error",
          message: "Print failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to print fee report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const printPaymentReport = useCallback(
    async (payment: StudentPaymentRow) => {
      const printWindow = window.open(
        "",
        "_blank",
        "noopener,noreferrer,width=1024,height=768",
      );

      if (!printWindow) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "Pop-up blocked. Please allow pop-ups and try again.",
        });
        return;
      }

      try {
        const school = await loadSchoolDetails();
        await generateStudentPaymentReportPdf(
          payment,
          getStudentPrintContext(),
          school,
          {
            mode: "print",
            autoClosePrintWindow: true,
            printWindow,
          },
        );
      } catch (error) {
        if (!printWindow.closed) {
          printWindow.close();
        }

        open?.({
          type: "error",
          message: "Print failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to print payment report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const downloadEnrollmentReport = useCallback(
    async (enrollmentId: number) => {
      try {
        const { report, school } = await loadEnrollmentReport(enrollmentId);

        const yearPart = String(report.academicYear.year ?? "year").replace(
          /\s+/g,
          "-",
        );
        const termPart = report.term.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const studentPart = report.student.fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        await generateEnrollmentTerminalReportPdf(report, school, {
          mode: "download",
          filename: `terminal-report-${studentPart}-${yearPart}-${termPart}.pdf`,
        });
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download terminal report.",
        });
      }
    },
    [loadEnrollmentReport, open],
  );

  const downloadFeeReport = useCallback(
    async (fee: StudentFeeRow) => {
      try {
        const school = await loadSchoolDetails();
        const studentPart = getStudentPrintContext().fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const yearPart = String(fee.academicYear ?? "year").replace(/\s+/g, "-");
        const termPart = String(fee.term ?? "term")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        await generateStudentFeeReportPdf(
          fee,
          getStudentPrintContext(),
          school,
          {
            mode: "download",
            filename: `fee-report-${studentPart}-${yearPart}-${termPart}.pdf`,
          },
        );
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download fee report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const downloadPaymentReport = useCallback(
    async (payment: StudentPaymentRow) => {
      try {
        const school = await loadSchoolDetails();
        const studentPart = getStudentPrintContext().fullName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const datePart = String(payment.paymentDate ?? "date").replace(/[^0-9]+/g, "-");

        await generateStudentPaymentReportPdf(
          payment,
          getStudentPrintContext(),
          school,
          {
            mode: "download",
            filename: `payment-report-${studentPart}-${datePart}.pdf`,
          },
        );
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download payment report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const enrollmentColumns = useMemo<ColumnDef<StudentEnrollmentRow>[]>(
    () => [
      {
        id: "className",
        accessorKey: "className",
        size: 180,
        header: () => <p className="column-title">Class</p>,
      },
      {
        id: "academicYear",
        accessorKey: "academicYear",
        size: 120,
        header: () => <p className="column-title">Academic Year</p>,
      },
      {
        id: "term",
        accessorKey: "term",
        size: 120,
        header: () => <p className="column-title">Term</p>,
      },
      {
        id: "supervisor",
        accessorKey: "supervisor",
        size: 180,
        header: () => <p className="column-title">Supervisor</p>,
      },
      {
        id: "enrollmentDate",
        accessorKey: "enrollmentDate",
        size: 140,
        header: () => <p className="column-title">Enrollment Date</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: "actions",
        size: 180,
        header: () => <p className="column-title">Actions</p>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ShowButton
              resource="continuous-assessments"
              recordItemId={row.original.id}
              variant="outline"
              size="sm"
            >
              <ActionButton type="view" />
            </ShowButton>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => printEnrollmentReport(row.original.id)}
            >
              <ActionButton type="print" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => downloadEnrollmentReport(row.original.id)}
              title="Download PDF"
            >
              <ActionButton type="download" />
            </Button>
          </div>
        ),
      },
    ],
    [downloadEnrollmentReport, printEnrollmentReport],
  );

  const feesColumns = useMemo<ColumnDef<StudentFeeRow>[]>(
    () => [
      {
        id: "feeName",
        accessorKey: "feeName",
        size: 160,
        header: () => <p className="column-title">Fee</p>,
      },
      {
        id: "academicYear",
        accessorKey: "academicYear",
        size: 120,
        header: () => <p className="column-title">Academic Year</p>,
      },
      {
        id: "term",
        accessorKey: "term",
        size: 120,
        header: () => <p className="column-title">Term</p>,
      },
      {
        id: "dueDate",
        accessorKey: "dueDate",
        size: 140,
        header: () => <p className="column-title">Due Date</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        size: 170,
        header: () => <p className="column-title">Amount</p>,
        cell: ({ row }) => {
          const amount = Number.parseFloat(row.original.amount ?? "0");
          const amountPaid = Number.parseFloat(row.original.amountPaid ?? "0");
          const remaining = Math.max(amount - amountPaid, 0);

          return (
            <div className="flex flex-col gap-1">
              <span className="text-foreground">{row.original.amount}</span>
              <Badge
                variant="outline"
                className={`w-fit text-[10px] ${
                  remaining > 0
                    ? "border-amber-300 bg-amber-100 text-amber-800"
                    : "border-green-300 bg-green-100 text-green-800"
                }`}
              >
                {remaining > 0
                  ? `Remaining: ${formatCurrency(remaining)}`
                  : "Fully paid"}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        size: 110,
        header: () => <p className="column-title">Status</p>,
        cell: ({ getValue }) => (
          <Badge
            variant={getValue<string>() === "paid" ? "default" : "secondary"}
          >
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        id: "actions",
        size: 190,
        header: () => <p className="column-title">Actions</p>,
        cell: ({ row }) => {
          const isPaid = row.original.status === "paid";

          if (isPaid) {
            return (
              <span className="text-xs text-muted-foreground">No action</span>
            );
          }

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/payments/create?studentId=${studentId}&studentFeeId=${row.original.id}`,
                  )
                }
              >
                Pay Fee
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => printFeeReport(row.original)}
              >
                <ActionButton type="print" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => downloadFeeReport(row.original)}
                title="Download PDF"
              >
                <ActionButton type="download" />
              </Button>
            </div>
          );
        },
      },
    ],
    [downloadFeeReport, navigate, printFeeReport, studentId],
  );

  const paymentColumns = useMemo<ColumnDef<StudentPaymentRow>[]>(
    () => [
      {
        id: "feeName",
        accessorKey: "feeName",
        size: 160,
        header: () => <p className="column-title">Fee</p>,
      },
      {
        id: "paymentMethod",
        accessorKey: "paymentMethod",
        size: 120,
        header: () => <p className="column-title">Method</p>,
      },
      {
        id: "paymentDate",
        accessorKey: "paymentDate",
        size: 130,
        header: () => <p className="column-title">Payment Date</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: "reference",
        accessorKey: "reference",
        size: 130,
        header: () => <p className="column-title">Reference</p>,
      },
      {
        id: "amount",
        accessorKey: "amount",
        size: 110,
        header: () => <p className="column-title">Amount</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        size: 110,
        header: () => <p className="column-title">Status</p>,
        cell: ({ getValue }) => (
          <Badge
            variant={getValue<string>() === "paid" ? "default" : "secondary"}
          >
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        id: "actions",
        size: 190,
        header: () => <p className="column-title">Actions</p>,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => printPaymentReport(row.original)}
              >
                <ActionButton type="print" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => downloadPaymentReport(row.original)}
                title="Download PDF"
              >
                <ActionButton type="download" />
              </Button>
            </div>
          );
        },
      },
    ],
    [downloadPaymentReport, printPaymentReport],
  );

  const siblingsColumns = useMemo<ColumnDef<StudentSiblingRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 180,
        header: "Name",
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "admissionDate",
        accessorKey: "admissionDate",
        size: 130,
        header: "Admission Date",
        cell: ({ getValue }) => (
          <span className="text-foreground">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: "currentClass",
        accessorKey: "currentClass",
        size: 220,
        header: "Current Class",
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "actions",
        size: 120,
        header: () => <p className="column-title">Actions</p>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ShowButton
              resource="students"
              recordItemId={row.original.id}
              variant="outline"
              size="sm"
            >
              <ActionButton type="view" />
            </ShowButton>
          </div>
        ),
      },
    ],
    [],
  );

  const enrollmentsTable = useTable<StudentEnrollmentRow>({
    columns: enrollmentColumns,
    refineCoreProps: {
      resource: `students/${studentId}/enrollments`,
      pagination: {
        pageSize: 5,
        mode: "server",
      },
    },
  });

  const feesTable = useTable<StudentFeeRow>({
    columns: feesColumns,
    refineCoreProps: {
      resource: `students/${studentId}/fees`,
      pagination: {
        pageSize: 5,
        mode: "server",
      },
    },
  });

  const paymentsTable = useTable<StudentPaymentRow>({
    columns: paymentColumns,
    refineCoreProps: {
      resource: `students/${studentId}/payments`,
      pagination: {
        pageSize: 5,
        mode: "server",
      },
    },
  });

  const siblingsTable = useTable<StudentSiblingRow>({
    columns: siblingsColumns,
    refineCoreProps: {
      resource: `students/${studentId}/siblings`,
      pagination: {
        pageSize: 5,
        mode: "server",
      },
    },
  });

  if (query.isLoading || query.isError || !student) {
    return (
      <ShowView className="class-view class-show">
        <ShowViewHeader resource="students" title="Student Details" />
        {query.isLoading ? (
          <PageLoader />
        ) : (
          <p className="state-message">
            {query.isError
              ? "Failed to load student details."
              : "Student details not found."}
          </p>
        )}
      </ShowView>
    );
  }

  const studentName = `${student.firstName} ${student.lastName}`;

  const latestEnrollment = (student.enrollments ?? []).reduce(
    (latest, current) => {
      if (!latest) return current;

      const latestDate = new Date(latest.enrollment.enrollmentDate).getTime();
      const currentDate = new Date(current.enrollment.enrollmentDate).getTime();

      return currentDate > latestDate ? current : latest;
    },
    student.enrollments?.[0],
  );

  return (
    <ShowView className="class-view class-show space-y-6">
      <ShowViewHeader resource="students" title="Student Details" />

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                {student.cloudinaryImageUrl && (
                  <AvatarImage
                    src={student.cloudinaryImageUrl}
                    alt={studentName}
                  />
                )}
                <AvatarFallback>{getInitials(studentName)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{studentName}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Reg No: {student.registrationNumber ?? "N/A"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge variant={student.isActive ? "default" : "secondary"}>
                {student.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={student.onScholarship ? "default" : "secondary"}>
                {student.onScholarship ? "On Scholarship" : "No Scholarship"}
              </Badge>
              <Badge variant={student.getDiscount ? "default" : "secondary"}>
                {student.getDiscount ? "Discount Enabled" : "No Discount"}
              </Badge>
              {student.gender && (
                <Badge variant="outline">
                  {student.gender.split("")[0].toUpperCase() +
                    student.gender.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">👤 Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Date of Birth
                </p>
                <p className="font-semibold text-sm">
                  {formatDate(student.dateOfBirth)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Admission Date
                </p>
                <p className="font-semibold text-sm">
                  {formatDate(student.admissionDate)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Current Class
                </p>
                <p className="font-semibold text-sm">
                  {latestEnrollment?.class?.name ?? "Unassigned"}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Academic Year
                </p>
                <p className="font-semibold text-sm">
                  {latestEnrollment?.academicYear?.year ?? "N/A"}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Scholarship
                </p>
                <p className="font-semibold text-sm">
                  {student.onScholarship ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Discount</p>
                <p className="font-semibold text-sm">
                  {student.getDiscount ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">
              👨‍👩‍👧 Parents ({student.parentRelations.length})
            </h3>
            {student.parentRelations.length > 0 ? (
              <div className="grid gap-2">
                {student.parentRelations.map((relation) => (
                  <div
                    key={`${relation.studentId}-${relation.parentId}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {relation.parent.firstName} {relation.parent.lastName}
                        {", "}
                        <span className="text-xs text-muted-foreground">
                          {relation.parent.occupation}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relation.parent.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Email: {relation.parent.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Phone: {relation.parent.phone}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {relation.relationship ?? "guardian"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No parent records found.
              </p>
            )}
          </div>

          <Separator />

          {student.siblingRelations.length > 0 && (
            <>
              <div>
                <h3 className="font-semibold mb-3">
                  Siblings ({student.siblingRelations.length})
                </h3>
                <DataTable table={siblingsTable} />
              </div>

              <Separator />
            </>
          )}

          <div>
            <h3 className="font-semibold mb-3">🎒 Academic Snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Enrollments
                </p>
                <p className="font-semibold text-lg">
                  {student.enrollments.length}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Assessments
                </p>
                <p className="font-semibold text-lg">
                  {student.assessments.length}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Positions</p>
                <p className="font-semibold text-lg">
                  {student.positions.length}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                <p className="font-semibold text-lg">
                  {student.attendances.length}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">🏫 Previous Schools</h3>
            {student.previousSchools.length > 0 ? (
              <div className="grid gap-2">
                {student.previousSchools.map((school) => (
                  <div key={school.id} className="p-3 border rounded-lg">
                    <p className="font-medium">{school.schoolName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Admission: {formatDate(school.dateOfAdmission)} · Last
                      Attended: {formatDate(school.dateLastAttended)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No previous school records.
              </p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">🩺 Health & Living Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {healthIndicators.map(({ key, label }) => (
                <div key={key} className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="font-semibold text-sm">
                    {student.healthDetails?.[key] ? "Yes" : "No"}
                  </p>
                </div>
              ))}
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Other Conditions
                </p>
                <p className="font-semibold text-sm">
                  {student.healthDetails?.otherConditions ?? "None recorded"}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Last Checkup
                </p>
                <p className="font-semibold text-sm">
                  {formatDate(student.healthDetails?.lastCheckupDate ?? null)}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Living With
                </p>
                <p className="font-semibold text-sm">
                  {student.otherSignificantData?.livingWith ?? "N/A"}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Other Details
                </p>
                <p className="font-semibold text-sm">
                  {student.otherSignificantData?.otherDetails ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Finance Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Fee Records</p>
              <p className="font-semibold text-lg">{student.fees.length}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Payments</p>
              <p className="font-semibold text-lg">{student.payments.length}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Siblings</p>
              <p className="font-semibold text-lg">
                {student.siblingRelations.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(student.enrollments.length > 0 ||
        student.fees.length > 0 ||
        student.payments.length > 0) && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Detailed Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {student.enrollments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Enrollments ({student.enrollments.length})
                </h3>
                <DataTable table={enrollmentsTable} />
              </div>
            )}

            <Separator />

            {student.fees.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Fees ({student.fees.length})
                </h3>
                <DataTable table={feesTable} />
              </div>
            )}

            <Separator />

            {student.payments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  Payments ({student.payments.length})
                </h3>
                <DataTable table={paymentsTable} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ShowView>
  );
};

export default ShowStudent;
