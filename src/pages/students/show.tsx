import {
  HttpError,
  useBack,
  useCreate,
  useDelete,
  useGetIdentity,
  useList,
  useNotification,
  useShow,
} from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { BACKEND_BASE_URL } from "@/constants";
import {
  ActionTooltip,
  actionButtonTitles,
  tableActionButtonClassName,
} from "@/components/actionButton";
import {
  generateEnrollmentTerminalReportPdf,
  generateStudentFeeReportPdf,
  generateStudentFeesReportPdf,
  generateStudentPaymentReportPdf,
  generateStudentPaymentsReportPdf,
  generateStudentSummariesReportPdf,
} from "@/lib/enrollment-terminal-report-pdf";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
  ShowView,
  ShowViewHeader,
} from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Student,
  ClassEnrollmentOverviewRow,
  SchoolDetailsRecord,
  StudentEnrollmentRow,
  StudentFeeRow,
  StudentPaymentRow,
  StudentSiblingRow,
  User,
  FeeRecord,
  TermRecord,
} from "@/types";
import PageLoader from "@/components/PageLoader";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import ActionButton from "@/components/actionButton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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

const normalizeLevel = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};

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

type StudentReportSelection =
  | "summary"
  | "all-summaries"
  | "fee"
  | "payment"
  | "all-fees"
  | "all-payments";

const getDateTimestamp = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (!value) continue;

    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  return 0;
};

const ShowStudent = () => {
  const { id } = useParams();
  const studentId = id ?? "";
  const navigate = useNavigate();
  const { open } = useNotification();
  const { mutateAsync: createStudentFee } = useCreate();
  const { mutateAsync: deleteStudentFee } = useDelete();
  const { mutateAsync: deletePayment } = useDelete();
  const [selectedReportType, setSelectedReportType] =
    useState<StudentReportSelection>("summary");
  const [selectedFeeReportId, setSelectedFeeReportId] = useState<string>("");
  const [selectedPaymentReportId, setSelectedPaymentReportId] =
    useState<string>("");
  const [feePendingDelete, setFeePendingDelete] =
    useState<StudentFeeRow | null>(null);
  const [paymentPendingDelete, setPaymentPendingDelete] =
    useState<StudentPaymentRow | null>(null);
  const [feeDeleteBlockedReason, setFeeDeleteBlockedReason] =
    useState<string | null>(null);
  const [paymentDeleteBlockedReason, setPaymentDeleteBlockedReason] =
    useState<string | null>(null);
  const [isDeletingFee, setIsDeletingFee] = useState(false);
  const [isDeletingPayment, setIsDeletingPayment] = useState(false);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [newFeeForm, setNewFeeForm] = useState({
    feeId: "",
    amount: "",
    dueDate: "",
  });

  const back = useBack();

  const { data: loggedInUser } = useGetIdentity<User>();

  const { result: availableFeesResult } = useList<FeeRecord>({
    resource: "fees",
    pagination: { pageSize: 2000 },
  });
  const { result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 2000 },
  });

  const { query } = useShow<Student>({
    resource: "students",
    id: studentId,
  });

  const student = query.data?.data;
  const availableFees = useMemo(
    () => availableFeesResult.data ?? [],
    [availableFeesResult.data],
  );
  const availableTerms = useMemo(
    () => termsResult.data ?? [],
    [termsResult.data],
  );

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
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
        const studentPart = getStudentPrintContext()
          .fullName.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const yearPart = String(fee.academicYear ?? "year").replace(
          /\s+/g,
          "-",
        );
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
        const studentPart = getStudentPrintContext()
          .fullName.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const datePart = String(payment.paymentDate ?? "date").replace(
          /[^0-9]+/g,
          "-",
        );

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

  const printFeesReport = useCallback(
    async (fees: StudentFeeRow[]) => {
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
        await generateStudentFeesReportPdf(
          fees,
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
              : "Unable to print fees report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const downloadFeesReport = useCallback(
    async (fees: StudentFeeRow[]) => {
      try {
        const school = await loadSchoolDetails();
        const studentPart = getStudentPrintContext()
          .fullName.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        await generateStudentFeesReportPdf(
          fees,
          getStudentPrintContext(),
          school,
          {
            mode: "download",
            filename: `fees-report-${studentPart}.pdf`,
          },
        );
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download fees report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const printPaymentsReport = useCallback(
    async (payments: StudentPaymentRow[]) => {
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
        await generateStudentPaymentsReportPdf(
          payments,
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
              : "Unable to print payments report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const downloadPaymentsReport = useCallback(
    async (payments: StudentPaymentRow[]) => {
      try {
        const school = await loadSchoolDetails();
        const studentPart = getStudentPrintContext()
          .fullName.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        await generateStudentPaymentsReportPdf(
          payments,
          getStudentPrintContext(),
          school,
          {
            mode: "download",
            filename: `payments-report-${studentPart}.pdf`,
          },
        );
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download payments report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const latestEnrollment = useMemo(() => {
    const enrollments = student?.enrollments ?? [];

    if (enrollments.length === 0) {
      return null;
    }

    return enrollments.reduce((latest, current) => {
      const latestDate = getDateTimestamp(latest.enrollment.enrollmentDate);
      const currentDate = getDateTimestamp(current.enrollment.enrollmentDate);

      return currentDate > latestDate ? current : latest;
    });
  }, [student?.enrollments]);

  const latestEnrollmentId = latestEnrollment?.enrollment.id ?? null;
  const currentEnrollmentAcademicYearId = latestEnrollment?.enrollment.academicYearId ?? null;
  const currentEnrollmentTermId = latestEnrollment?.enrollment.termId ?? null;
  const currentEnrollmentClassLevel = latestEnrollment?.class?.level ?? null;
  const currentEnrollmentAcademicYearLabel =
    latestEnrollment?.academicYear?.year?.toString() ?? "N/A";

  const currentEnrollmentTermLabel = useMemo(() => {
    if (!currentEnrollmentTermId) {
      return "N/A";
    }

    const term = availableTerms.find((item) => item.id === currentEnrollmentTermId);
    return term?.name ?? "N/A";
  }, [availableTerms, currentEnrollmentTermId]);

  const availableFeesForCurrentEnrollment = useMemo(() => {
    if (!currentEnrollmentAcademicYearId || !currentEnrollmentTermId) {
      return [];
    }

    const classLevel = normalizeLevel(currentEnrollmentClassLevel);

    return availableFees
      .filter((fee) => fee.academicYearId === currentEnrollmentAcademicYearId)
      .filter(
        (fee) => fee.applicableTermId === null || fee.applicableTermId === currentEnrollmentTermId,
      )
      .filter((fee) => {
        const level = normalizeLevel(fee.applicableToLevel);
        const isAllLevel = !level || level === "all" || level === "all levels";
        return isAllLevel || (classLevel.length > 0 && level === classLevel);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [
    availableFees,
    currentEnrollmentAcademicYearId,
    currentEnrollmentClassLevel,
    currentEnrollmentTermId,
  ]);

  const openAddFeeDialog = () => {
    if (!currentEnrollmentAcademicYearId || !currentEnrollmentTermId) {
      open?.({
        type: "error",
        message: "No active enrollment context",
        description:
          "This student has no enrollment term/year context to attach a fee.",
      });
      return;
    }

    setIsAddFeeDialogOpen(true);
    setNewFeeForm({
      feeId: "",
      amount: "",
      dueDate: "",
    });
  };

  const enrollmentSummaries = useMemo(() => {
    const enrollments = student?.enrollments ?? [];
    return [...enrollments].sort((left, right) => {
      return (
        getDateTimestamp(right.enrollment.enrollmentDate) -
        getDateTimestamp(left.enrollment.enrollmentDate)
      );
    });
  }, [student?.enrollments]);

  const printSummariesReport = useCallback(
    async (enrollmentIds: number[]) => {
      const printWindow = window.open("", "_blank", "width=1024,height=768");

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
        const reports: ClassEnrollmentOverviewRow[] = [];

        for (const enrollmentId of enrollmentIds) {
          try {
            const response = await fetch(
              buildApiUrl(
                `/student-class-enrollments/overview?enrollmentId=${enrollmentId}&limit=1`,
              ),
              { credentials: "include" },
            );
            if (response.ok) {
              const payload = (await response.json()) as {
                success?: boolean;
                data?: ClassEnrollmentOverviewRow[];
              };
              const report = payload.data?.[0];
              if (report) reports.push(report);
            }
          } catch {
            // Continue fetching other reports
          }
        }

        if (reports.length === 0) {
          throw new Error("No enrollment summaries could be fetched.");
        }

        await generateStudentSummariesReportPdf(
          reports,
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
              : "Unable to print summaries report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const downloadSummariesReport = useCallback(
    async (enrollmentIds: number[]) => {
      try {
        const school = await loadSchoolDetails();
        const reports: ClassEnrollmentOverviewRow[] = [];

        for (const enrollmentId of enrollmentIds) {
          try {
            const response = await fetch(
              buildApiUrl(
                `/student-class-enrollments/overview?enrollmentId=${enrollmentId}&limit=1`,
              ),
              { credentials: "include" },
            );
            if (response.ok) {
              const payload = (await response.json()) as {
                success?: boolean;
                data?: ClassEnrollmentOverviewRow[];
              };
              const report = payload.data?.[0];
              if (report) reports.push(report);
            }
          } catch {
            // Continue fetching other reports
          }
        }

        if (reports.length === 0) {
          throw new Error("No enrollment summaries could be fetched.");
        }

        const studentPart = getStudentPrintContext()
          .fullName.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");

        await generateStudentSummariesReportPdf(
          reports,
          getStudentPrintContext(),
          school,
          {
            mode: "download",
            filename: `summaries-report-${studentPart}.pdf`,
          },
        );
      } catch (error) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to download summaries report.",
        });
      }
    },
    [getStudentPrintContext, loadSchoolDetails, open],
  );

  const feeReports = useMemo<StudentFeeRow[]>(() => {
    const fees = student?.fees ?? [];

    return [...fees]
      .sort((left, right) => {
        return (
          getDateTimestamp(
            right.studentFee.dueDate,
            right.studentFee.updatedAt,
            right.studentFee.createdAt,
          ) -
          getDateTimestamp(
            left.studentFee.dueDate,
            left.studentFee.updatedAt,
            left.studentFee.createdAt,
          )
        );
      })
      .map((fee) => ({
        id: fee.studentFee.id,
        feeName: fee.fee?.name ?? `Fee #${fee.studentFee.feeId}`,
        amount: fee.studentFee.amount,
        amountPaid: fee.studentFee.amountPaid,
        dueDate: fee.studentFee.dueDate ?? "",
        academicYear: fee.academicYear?.year
          ? String(fee.academicYear.year)
          : "N/A",
        term: fee.term?.name ?? "N/A",
        status: fee.studentFee.status,
      }));
  }, [student?.fees]);

  const paymentReports = useMemo<StudentPaymentRow[]>(() => {
    const payments = student?.payments ?? [];

    return [...payments]
      .sort((left, right) => {
        return (
          getDateTimestamp(right.payment.paymentDate, right.payment.createdAt) -
          getDateTimestamp(left.payment.paymentDate, left.payment.createdAt)
        );
      })
      .map((payment) => {
        const linkedFeeId =
          payment.studentFee?.id ?? payment.payment.studentFeeId;
        const linkedFee = (student?.fees ?? []).find(
          (item) => item.studentFee.id === linkedFeeId,
        );

        return {
          id: payment.payment.id,
          amount: payment.payment.amount,
          paymentDate: payment.payment.paymentDate,
          paymentMethod: payment.payment.paymentMethod ?? "N/A",
          reference: payment.payment.reference ?? "N/A",
          feeName:
            linkedFee?.fee?.name ??
            (linkedFeeId ? `Fee #${linkedFeeId}` : "Unallocated"),
          status: payment.studentFee?.status ?? "paid",
        };
      });
  }, [student?.fees, student?.payments]);

  const selectedFeeReport =
    feeReports.find((fee) => fee.id.toString() === selectedFeeReportId) ??
    feeReports[0] ??
    null;

  const selectedPaymentReport =
    paymentReports.find(
      (payment) => payment.id.toString() === selectedPaymentReportId,
    ) ??
    paymentReports[0] ??
    null;

  const selectedReportAvailable =
    (selectedReportType === "summary" && latestEnrollmentId !== null) ||
    (selectedReportType === "all-summaries" &&
      enrollmentSummaries.length > 0) ||
    (selectedReportType === "fee" && selectedFeeReport !== null) ||
    (selectedReportType === "payment" && selectedPaymentReport !== null) ||
    (selectedReportType === "all-fees" && feeReports.length > 0) ||
    (selectedReportType === "all-payments" && paymentReports.length > 0);

  const selectedReportHelpText =
    selectedReportType === "summary"
      ? latestEnrollmentId !== null
        ? "Prints or downloads the latest student summary."
        : "No enrollment summary is available for this student yet."
      : selectedReportType === "all-summaries"
      ? enrollmentSummaries.length > 0
        ? `Prints or downloads a combined PDF for all ${enrollmentSummaries.length} enrollment summaries.`
        : "No enrollment summaries are available for this student yet."
      : selectedReportType === "fee"
      ? selectedFeeReport
        ? `Prints or downloads the selected fee record: ${selectedFeeReport.feeName}.`
        : "No fee record is available for this student yet."
      : selectedReportType === "payment"
      ? selectedPaymentReport
        ? `Prints or downloads the selected payment record: ${selectedPaymentReport.feeName}.`
        : "No payment record is available for this student yet."
      : selectedReportType === "all-fees"
      ? feeReports.length > 0
        ? `Prints or downloads a combined PDF for all ${feeReports.length} fee records.`
        : "No fee records are available for this student yet."
      : paymentReports.length > 0
      ? `Prints or downloads a combined PDF for all ${paymentReports.length} payment records.`
      : "No payment records are available for this student yet.";

  const handleSelectedReportPrint = useCallback(async () => {
    if (selectedReportType === "summary") {
      if (latestEnrollmentId === null) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "No enrollment summary is available for this student.",
        });
        return;
      }

      await printEnrollmentReport(latestEnrollmentId);
      return;
    }

    if (selectedReportType === "all-summaries") {
      if (enrollmentSummaries.length === 0) {
        open?.({
          type: "error",
          message: "Print failed",
          description:
            "No enrollment summaries are available for this student.",
        });
        return;
      }

      const enrollmentIds = enrollmentSummaries.map((e) => e.enrollment.id);
      await printSummariesReport(enrollmentIds);
      return;
    }

    if (selectedReportType === "fee") {
      if (!selectedFeeReport) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "No fee record is available for this student.",
        });
        return;
      }

      await printFeeReport(selectedFeeReport);
      return;
    }

    if (selectedReportType === "all-fees") {
      if (feeReports.length === 0) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "No fee records are available for this student.",
        });
        return;
      }

      await printFeesReport(feeReports);
      return;
    }

    if (selectedReportType === "all-payments") {
      if (paymentReports.length === 0) {
        open?.({
          type: "error",
          message: "Print failed",
          description: "No payment records are available for this student.",
        });
        return;
      }

      await printPaymentsReport(paymentReports);
      return;
    }

    if (!selectedPaymentReport) {
      open?.({
        type: "error",
        message: "Print failed",
        description: "No payment record is available for this student.",
      });
      return;
    }

    await printPaymentReport(selectedPaymentReport);
  }, [
    enrollmentSummaries,
    feeReports,
    latestEnrollmentId,
    open,
    paymentReports,
    printEnrollmentReport,
    printFeeReport,
    printFeesReport,
    printPaymentReport,
    printPaymentsReport,
    printSummariesReport,
    selectedFeeReport,
    selectedPaymentReport,
    selectedReportType,
  ]);

  const handleSelectedReportDownload = useCallback(async () => {
    if (selectedReportType === "summary") {
      if (latestEnrollmentId === null) {
        open?.({
          type: "error",
          message: "Download failed",
          description: "No enrollment summary is available for this student.",
        });
        return;
      }

      await downloadEnrollmentReport(latestEnrollmentId);
      return;
    }

    if (selectedReportType === "all-summaries") {
      if (enrollmentSummaries.length === 0) {
        open?.({
          type: "error",
          message: "Download failed",
          description:
            "No enrollment summaries are available for this student.",
        });
        return;
      }

      const enrollmentIds = enrollmentSummaries.map((e) => e.enrollment.id);
      await downloadSummariesReport(enrollmentIds);
      return;
    }

    if (selectedReportType === "fee") {
      if (!selectedFeeReport) {
        open?.({
          type: "error",
          message: "Download failed",
          description: "No fee record is available for this student.",
        });
        return;
      }

      await downloadFeeReport(selectedFeeReport);
      return;
    }

    if (selectedReportType === "all-fees") {
      if (feeReports.length === 0) {
        open?.({
          type: "error",
          message: "Download failed",
          description: "No fee records are available for this student.",
        });
        return;
      }

      await downloadFeesReport(feeReports);
      return;
    }

    if (selectedReportType === "all-payments") {
      if (paymentReports.length === 0) {
        open?.({
          type: "error",
          message: "Download failed",
          description: "No payment records are available for this student.",
        });
        return;
      }

      await downloadPaymentsReport(paymentReports);
      return;
    }

    if (!selectedPaymentReport) {
      open?.({
        type: "error",
        message: "Download failed",
        description: "No payment record is available for this student.",
      });
      return;
    }

    await downloadPaymentReport(selectedPaymentReport);
  }, [
    downloadEnrollmentReport,
    downloadFeesReport,
    downloadFeeReport,
    downloadPaymentReport,
    downloadPaymentsReport,
    downloadSummariesReport,
    enrollmentSummaries,
    feeReports,
    latestEnrollmentId,
    open,
    paymentReports,
    selectedFeeReport,
    selectedPaymentReport,
    selectedReportType,
  ]);

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

            <ActionTooltip title={actionButtonTitles.print}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={tableActionButtonClassName}
                aria-label={actionButtonTitles.print}
                onClick={() => printEnrollmentReport(row.original.id)}
              >
                <ActionButton type="print" />
              </Button>
            </ActionTooltip>

            <ActionTooltip title={actionButtonTitles.download}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={tableActionButtonClassName}
                aria-label={actionButtonTitles.download}
                onClick={() => downloadEnrollmentReport(row.original.id)}
              >
                <ActionButton type="download" />
              </Button>
            </ActionTooltip>
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
              {(loggedInUser?.role === "admin" ||
                loggedInUser?.role === "staff") && (
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
              )}

              <ActionTooltip title={actionButtonTitles.print}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={tableActionButtonClassName}
                  aria-label={actionButtonTitles.print}
                  onClick={() => printFeeReport(row.original)}
                >
                  <ActionButton type="print" />
                </Button>
              </ActionTooltip>

              <ActionTooltip title={actionButtonTitles.download}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={tableActionButtonClassName}
                  aria-label={actionButtonTitles.download}
                  onClick={() => downloadFeeReport(row.original)}
                >
                  <ActionButton type="download" />
                </Button>
              </ActionTooltip>

              {loggedInUser?.role === "admin" && (
                <ActionTooltip title={actionButtonTitles.delete}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setFeePendingDelete(row.original)}
                  >
                    <ActionButton type="delete" />
                  </Button>
                </ActionTooltip>
              )}
            </div>
          );
        },
      },
    ],
    [
      downloadFeeReport,
      loggedInUser?.role,
      navigate,
      printFeeReport,
      studentId,
    ],
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
              <ActionTooltip title={actionButtonTitles.print}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={tableActionButtonClassName}
                  aria-label={actionButtonTitles.print}
                  onClick={() => printPaymentReport(row.original)}
                >
                  <ActionButton type="print" />
                </Button>
              </ActionTooltip>

              <ActionTooltip title={actionButtonTitles.download}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={tableActionButtonClassName}
                  aria-label={actionButtonTitles.download}
                  onClick={() => downloadPaymentReport(row.original)}
                >
                  <ActionButton type="download" />
                </Button>
              </ActionTooltip>

              {loggedInUser?.role === "admin" && (
                <ActionTooltip title={actionButtonTitles.delete}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => setPaymentPendingDelete(row.original)}
                  >
                    <ActionButton type="delete" />
                  </Button>
                </ActionTooltip>
              )}
            </div>
          );
        },
      },
    ],
    [downloadPaymentReport, loggedInUser?.role, printPaymentReport],
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

  const refetchStudentRelatedTables = async () => {
    await Promise.all([
      query.refetch(),
      feesTable.refineCore.tableQuery?.refetch(),
      paymentsTable.refineCore.tableQuery?.refetch(),
    ]);
  };

  const handleFeeSelection = (feeId: string) => {
    const selectedFee = availableFeesForCurrentEnrollment.find(
      (fee) => String(fee.id) === feeId,
    );

    if (!selectedFee) {
      setNewFeeForm((prev) => ({
        ...prev,
        feeId,
        amount: "",
      }));
      return;
    }

    setNewFeeForm((prev) => ({
      ...prev,
      feeId,
      amount: selectedFee.amount,
    }));
  };

  const handleAssignFeeToStudent = async () => {
    const feeId = Number.parseInt(newFeeForm.feeId, 10);
    const termId = currentEnrollmentTermId;
    const amount = Number.parseFloat(newFeeForm.amount);

    if (!Number.isFinite(feeId) || feeId < 1) {
      open?.({
        type: "error",
        message: "Invalid fee",
        description: "Please select a fee to assign.",
      });
      return;
    }

    if (!termId || termId < 1) {
      open?.({
        type: "error",
        message: "Invalid term",
        description: "Could not resolve the current enrollment term.",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      open?.({
        type: "error",
        message: "Invalid amount",
        description: "Amount must be greater than zero.",
      });
      return;
    }

    setIsAddingFee(true);
    try {
      await createStudentFee({
        resource: "student-fees",
        values: {
          studentId: Number(studentId),
          feeId,
          termId,
          amount: amount.toFixed(2),
          dueDate: newFeeForm.dueDate.trim() || null,
        },
        successNotification: false,
        errorNotification: false,
      });

      await refetchStudentRelatedTables();

      open?.({
        type: "success",
        message: "Fee added",
        description: "Fee has been assigned to this student.",
      });

      setIsAddFeeDialogOpen(false);
      setNewFeeForm({ feeId: "", amount: "", dueDate: "" });
    } catch (error) {
      open?.({
        type: "error",
        message: "Could not add fee",
        description: extractErrorMessage(error, "Failed to assign fee to student."),
      });
    } finally {
      setIsAddingFee(false);
    }
  };

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

  const handleConfirmFeeDelete = async () => {
    if (!feePendingDelete || isDeletingFee) return;

    setIsDeletingFee(true);
    try {
      await deleteStudentFee(
        {
          resource: "student-fees",
          id: feePendingDelete.id,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: () => {
            setFeePendingDelete(null);
          },
        },
      );

      await refetchStudentRelatedTables();

      open?.({
        type: "success",
        message: "Fee deleted",
        description: `"${feePendingDelete.feeName}" was deleted successfully.`,
      });
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as HttpError).statusCode)
          : undefined;
      const reason = extractErrorMessage(
        error,
        "We could not delete this fee right now.",
      );

      if (statusCode === 409) {
        setFeeDeleteBlockedReason(reason);
      } else {
        open?.({
          type: "error",
          message: "Delete failed",
          description: reason,
        });
      }

      setFeePendingDelete(null);
    } finally {
      setIsDeletingFee(false);
    }
  };

  const handleConfirmPaymentDelete = async () => {
    if (!paymentPendingDelete || isDeletingPayment) return;

    setIsDeletingPayment(true);
    try {
      await deletePayment(
        {
          resource: "payments",
          id: paymentPendingDelete.id,
          successNotification: false,
          errorNotification: false,
        },
        {
          onSuccess: () => {
            setPaymentPendingDelete(null);
          },
        },
      );

      await refetchStudentRelatedTables();

      open?.({
        type: "success",
        message: "Payment deleted",
        description: `Payment for "${paymentPendingDelete.feeName}" was deleted successfully.`,
      });
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as HttpError).statusCode)
          : undefined;
      const reason = extractErrorMessage(
        error,
        "We could not delete this payment right now.",
      );

      if (statusCode === 409) {
        setPaymentDeleteBlockedReason(reason);
      } else {
        open?.({
          type: "error",
          message: "Delete failed",
          description: reason,
        });
      }

      setPaymentPendingDelete(null);
    } finally {
      setIsDeletingPayment(false);
    }
  };

  return (
    <ShowView className="class-view class-show space-y-6">
      {loggedInUser?.role === "admin" ? (
        <ShowViewHeader resource="students" title="Student Details" />
      ) : (
        <div className="intro-row">
          <h1 className="page-title">Student Details</h1>
          <Button onClick={back} className="cursor-pointer" type="button">
            Go Back
          </Button>
        </div>
      )}

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
            <div className="flex flex-col items-end gap-4">
              <div className="flex gap-2 flex-wrap justify-end">
                <Badge variant={student.isActive ? "default" : "secondary"}>
                  {student.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={student.onScholarship ? "default" : "secondary"}
                >
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

              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Select
                    value={selectedReportType}
                    onValueChange={(value) =>
                      setSelectedReportType(value as StudentReportSelection)
                    }
                  >
                    <SelectTrigger
                      className="w-47.5 bg-background"
                      aria-label="Select report to print or download"
                    >
                      <SelectValue placeholder="Select report" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="all-summaries">
                        All Summaries
                      </SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="all-fees">All Fees</SelectItem>
                      <SelectItem value="all-payments">All Payments</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedReportType === "fee" && (
                    <Select
                      value={selectedFeeReport?.id.toString() ?? ""}
                      onValueChange={setSelectedFeeReportId}
                      disabled={feeReports.length === 0}
                    >
                      <SelectTrigger
                        className="min-w-56 bg-background"
                        aria-label="Select fee record"
                      >
                        <SelectValue placeholder="Select fee record" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeReports.map((fee) => (
                          <SelectItem key={fee.id} value={fee.id.toString()}>
                            {fee.feeName} | {fee.term} |{" "}
                            {formatDate(fee.dueDate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedReportType === "payment" && (
                    <Select
                      value={selectedPaymentReport?.id.toString() ?? ""}
                      onValueChange={setSelectedPaymentReportId}
                      disabled={paymentReports.length === 0}
                    >
                      <SelectTrigger
                        className="min-w-56 bg-background"
                        aria-label="Select payment record"
                      >
                        <SelectValue placeholder="Select payment record" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentReports.map((payment) => (
                          <SelectItem
                            key={payment.id}
                            value={payment.id.toString()}
                          >
                            {payment.feeName} |{" "}
                            {formatDate(payment.paymentDate)} | {payment.amount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 cursor-pointer"
                    disabled={!selectedReportAvailable}
                    onClick={handleSelectedReportPrint}
                  >
                    <ActionButton type="print" />
                    <span>Print</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2 cursor-pointer"
                    disabled={!selectedReportAvailable}
                    onClick={handleSelectedReportDownload}
                  >
                    <ActionButton type="download" />
                    <span>Download</span>
                  </Button>
                </div>
                <p className="text-right text-xs text-muted-foreground">
                  {selectedReportHelpText}
                </p>
              </div>
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
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Fees ({student.fees.length})</h3>
                  {loggedInUser?.role === "admin" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={openAddFeeDialog}
                    >
                      Add Fee
                    </Button>
                  )}
                </div>
                <DataTable table={feesTable} />
              </div>
            )}

            {student.fees.length === 0 && loggedInUser?.role === "admin" && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Fees (0)</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={openAddFeeDialog}
                  >
                    Add Fee
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  No fee records yet for this student.
                </p>
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

      <AlertDialog
        open={Boolean(feePendingDelete)}
        onOpenChange={(openState) => {
          if (!openState && !isDeletingFee) {
            setFeePendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fee?</AlertDialogTitle>
            <AlertDialogDescription>
              {feePendingDelete
                ? `This will permanently delete "${feePendingDelete.feeName}" for this student.`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingFee}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await handleConfirmFeeDelete();
              }}
              disabled={isDeletingFee}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingFee ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isAddFeeDialogOpen}
        onOpenChange={(openState) => {
          if (!openState && !isAddingFee) {
            setIsAddFeeDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add fee to student</AlertDialogTitle>
            <AlertDialogDescription>
              Assign an existing fee definition using the student's current enrollment context.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={currentEnrollmentAcademicYearLabel} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Term</Label>
                <Input value={currentEnrollmentTermLabel} readOnly />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Class Level</Label>
              <Input value={currentEnrollmentClassLevel ?? "N/A"} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-fee-id">Fee</Label>
              <Select value={newFeeForm.feeId} onValueChange={handleFeeSelection}>
                <SelectTrigger id="new-fee-id">
                  <SelectValue placeholder="Select fee" />
                </SelectTrigger>
                <SelectContent>
                  {availableFeesForCurrentEnrollment.map((fee) => (
                    <SelectItem key={fee.id} value={String(fee.id)}>
                      {fee.name} ({fee.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableFeesForCurrentEnrollment.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No fees available for the current enrollment level/year/term.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-fee-amount">Amount</Label>
              <Input
                id="new-fee-amount"
                type="number"
                min="0"
                step="0.01"
                value={newFeeForm.amount}
                onChange={(event) =>
                  setNewFeeForm((prev) => ({
                    ...prev,
                    amount: event.target.value,
                  }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-fee-due-date">Due Date (optional)</Label>
              <Input
                id="new-fee-due-date"
                type="date"
                value={newFeeForm.dueDate}
                onChange={(event) =>
                  setNewFeeForm((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAddingFee}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await handleAssignFeeToStudent();
              }}
              disabled={isAddingFee}
            >
              {isAddingFee ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                "Add Fee"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(feeDeleteBlockedReason)}
        onOpenChange={(openState) => {
          if (!openState) {
            setFeeDeleteBlockedReason(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fee cannot be deleted yet</AlertDialogTitle>
            <AlertDialogDescription>
              {feeDeleteBlockedReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(paymentPendingDelete)}
        onOpenChange={(openState) => {
          if (!openState && !isDeletingPayment) {
            setPaymentPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentPendingDelete
                ? `This will permanently delete this payment record for "${paymentPendingDelete.feeName}".`
                : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPayment}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (event) => {
                event.preventDefault();
                await handleConfirmPaymentDelete();
              }}
              disabled={isDeletingPayment}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingPayment ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(paymentDeleteBlockedReason)}
        onOpenChange={(openState) => {
          if (!openState) {
            setPaymentDeleteBlockedReason(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payment cannot be deleted yet</AlertDialogTitle>
            <AlertDialogDescription>
              {paymentDeleteBlockedReason}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Understood</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ShowView>
  );
};

export default ShowStudent;
