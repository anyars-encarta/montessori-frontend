import { useEffect, useMemo, useState } from "react";

import { BACKEND_BASE_URL } from "@/constants";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AcademicYearRecord,
  AttendanceHistoryResponse,
  AttendanceHistoryRow,
  AttendanceStatus,
  BulkMarkResponse,
  ClassRecord,
  DailyAttendanceRow,
  DailyRegisterResponse,
  StudentBasic,
  TermRecord,
} from "@/types";
import { useList, useNotification } from "@refinedev/core";
import { Check, Download, Loader2, Save } from "lucide-react";

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const isWeekdayIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getUTCDay();
  return day >= 1 && day <= 5;
};

const buildApiUrl = (path: string) => {
  const base = BACKEND_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const StudentAttendancePage = () => {
  const { open } = useNotification();

  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(toIsoDate(new Date()));
  const [rows, setRows] = useState<DailyAttendanceRow[]>([]);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [isSavingRegister, setIsSavingRegister] = useState(false);
  const [historyRows, setHistoryRows] = useState<AttendanceHistoryRow[]>([]);
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [historyStudentId, setHistoryStudentId] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { result: classesResult } = useList<ClassRecord>({
    resource: "classes",
    pagination: { pageSize: 500 },
  });

  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 200 },
  });

  const { result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 500 },
  });

  const { result: studentsResult } = useList<StudentBasic>({
    resource: "students",
    pagination: { pageSize: 1000 },
  });

  const classes = classesResult.data;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;
  const students = studentsResult.data;

  const filteredTerms = useMemo(() => {
    if (!academicYearId) return [];
    const id = Number.parseInt(academicYearId, 10);
    return terms.filter((term) => term.academicYearId === id);
  }, [academicYearId, terms]);

  useEffect(() => {
    if (!termId) return;
    const exists = filteredTerms.some((term) => String(term.id) === termId);
    if (!exists) {
      setTermId("");
    }
  }, [filteredTerms, termId]);

  const summary = useMemo(() => {
    const present = rows.filter((row) => row.status === "present").length;
    const absent = rows.filter((row) => row.status === "absent").length;
    return {
      total: rows.length,
      present,
      absent,
      unmarked: rows.length - present - absent,
    };
  }, [rows]);

  const canLoadRegister = Boolean(classId && academicYearId && termId && attendanceDate);

  const loadRegister = async () => {
    if (!canLoadRegister) {
      open?.({
        type: "error",
        message: "Missing selection",
        description: "Select class, academic year, term, and date first.",
      });
      return;
    }

    if (!isWeekdayIsoDate(attendanceDate)) {
      open?.({
        type: "error",
        message: "Invalid attendance date",
        description: "Attendance can only be marked for Monday to Friday.",
      });
      return;
    }

    setIsLoadingRegister(true);

    try {
      const params = new URLSearchParams({
        classId,
        academicYearId,
        termId,
        attendanceDate,
      });

      const response = await fetch(
        buildApiUrl(`/student-attendances/daily-register?${params.toString()}`),
        {
          credentials: "include",
        },
      );

      const payload = (await response.json()) as DailyRegisterResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to load register");
      }

      setRows(payload.data ?? []);
    } catch (error) {
      open?.({
        type: "error",
        message: "Load failed",
        description:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Could not load student register",
      });
      setRows([]);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  const setStatusForRow = (studentId: number, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((row) => (row.studentId === studentId ? { ...row, status } : row)),
    );
  };

  const setRemarksForRow = (studentId: number, remarks: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              remarks: remarks.trim() ? remarks : null,
            }
          : row,
      ),
    );
  };

  const markAll = (status: AttendanceStatus) => {
    setRows((prev) => prev.map((row) => ({ ...row, status })));
  };

  const saveRegister = async () => {
    if (!canLoadRegister || !rows.length) {
      open?.({
        type: "error",
        message: "Nothing to save",
        description: "Load a class register first.",
      });
      return;
    }

    if (!isWeekdayIsoDate(attendanceDate)) {
      open?.({
        type: "error",
        message: "Invalid attendance date",
        description: "Attendance can only be marked for Monday to Friday.",
      });
      return;
    }

    const hasUnmarked = rows.some((row) => row.status === null);
    if (hasUnmarked) {
      open?.({
        type: "error",
        message: "Incomplete attendance",
        description: "Mark every student as present or absent before saving.",
      });
      return;
    }

    setIsSavingRegister(true);

    try {
      const response = await fetch(buildApiUrl("/student-attendances/bulk-mark"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          classId,
          academicYearId,
          termId,
          attendanceDate,
          entries: rows.map((row) => ({
            studentId: row.studentId,
            status: row.status,
            remarks: row.remarks,
          })),
        }),
      });

      const payload = (await response.json()) as BulkMarkResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to save attendance");
      }

      open?.({
        type: "success",
        message: "Attendance saved",
        description: `${payload.data?.totalProcessed ?? rows.length} attendance records were saved.`,
      });

      await loadRegister();
      await loadHistory();
    } catch (error) {
      open?.({
        type: "error",
        message: "Save failed",
        description:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Could not save attendance register",
      });
    } finally {
      setIsSavingRegister(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "500");

      if (classId) params.set("classId", classId);
      if (academicYearId) params.set("academicYearId", academicYearId);
      if (termId) params.set("termId", termId);
      if (historyFromDate) params.set("fromDate", historyFromDate);
      if (historyToDate) params.set("toDate", historyToDate);
      if (historyStudentId) params.set("studentId", historyStudentId);
      if (historyStatus) params.set("status", historyStatus);
      if (historySearch.trim()) params.set("search", historySearch.trim());

      const response = await fetch(
        buildApiUrl(`/student-attendances?${params.toString()}`),
        {
          credentials: "include",
        },
      );

      const payload = (await response.json()) as AttendanceHistoryResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to load attendance history");
      }

      setHistoryRows(payload.data ?? []);
    } catch (error) {
      open?.({
        type: "error",
        message: "History load failed",
        description:
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Could not load attendance history",
      });
      setHistoryRows([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const exportHistoryCsv = () => {
    if (!historyRows.length) {
      open?.({
        type: "error",
        message: "Nothing to export",
        description: "Load attendance history before exporting.",
      });
      return;
    }

    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = [
      "Date",
      "Student Name",
      "Registration Number",
      "Class",
      "Status",
      "Remarks",
    ];

    const rowsForCsv = historyRows.map((row) => [
      row.attendanceDate,
      row.studentName,
      row.registrationNumber ?? "",
      row.class ? `${row.class.name} (${row.class.level})` : "",
      row.status,
      row.remarks ?? "",
    ]);

    const csv = [header, ...rowsForCsv]
      .map((line) => line.map((cell) => escapeCell(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-history-${toIsoDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ListView className="space-y-6">
      <Breadcrumb />

      <h1 className="page-title">Student Attendance</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={classId || "all"}
                onValueChange={(value) => setClassId(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select class</SelectItem>
                  {classes.map((classRow) => (
                    <SelectItem key={classRow.id} value={String(classRow.id)}>
                      {classRow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select
                value={academicYearId || "all"}
                onValueChange={(value) => setAcademicYearId(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select year</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {year.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={termId || "all"}
                onValueChange={(value) => setTermId(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select term</SelectItem>
                  {filteredTerms.map((term) => (
                    <SelectItem key={term.id} value={String(term.id)}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setAttendanceDate(value);

                  if (value && !isWeekdayIsoDate(value)) {
                    open?.({
                      type: "error",
                      message: "Weekend not allowed",
                      description:
                        "Please pick a Monday to Friday date for attendance.",
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={loadRegister}
              disabled={!canLoadRegister || isLoadingRegister}
            >
              {isLoadingRegister ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load Register"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => markAll("present")}
              disabled={!rows.length || isLoadingRegister || isSavingRegister}
            >
              Mark All Present
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => markAll("absent")}
              disabled={!rows.length || isLoadingRegister || isSavingRegister}
            >
              Mark All Absent
            </Button>

            <Button
              type="button"
              className="ml-auto"
              onClick={saveRegister}
              disabled={!rows.length || isLoadingRegister || isSavingRegister}
            >
              {isSavingRegister ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Attendance
                </span>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Total: {summary.total}</Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-600">
              Present: {summary.present}
            </Badge>
            <Badge variant="destructive">Absent: {summary.absent}</Badge>
            <Badge variant="outline">Unmarked: {summary.unmarked}</Badge>
          </div>

          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Load a register to start marking attendance.
              </p>
            ) : (
              rows.map((row, index) => (
                <div
                  key={row.studentId}
                  className="grid gap-2 rounded-md border p-3 md:grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1.2fr)_220px]"
                >
                  <div className="text-sm text-muted-foreground">{index + 1}</div>

                  <div>
                    <p className="text-sm font-medium">{row.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.registrationNumber ?? "No Reg. Number"}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.status === "present" ? "default" : "outline"}
                      onClick={() => setStatusForRow(row.studentId, "present")}
                    >
                      <Check className="h-4 w-4" />
                      Present
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.status === "absent" ? "destructive" : "outline"}
                      onClick={() => setStatusForRow(row.studentId, "absent")}
                    >
                      Absent
                    </Button>
                  </div>

                  <Input
                    placeholder="Optional remark"
                    value={row.remarks ?? ""}
                    onChange={(event) => setRemarksForRow(row.studentId, event.target.value)}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance History & Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={historyFromDate}
                onChange={(event) => setHistoryFromDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={historyToDate}
                onChange={(event) => setHistoryToDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={historyStudentId || "all"}
                onValueChange={(value) => setHistoryStudentId(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={String(student.id)}>
                      {student.firstName} {student.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={historyStatus || "all"}
                onValueChange={(value) => setHistoryStatus(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <Input
                placeholder="Name or registration number"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={loadHistory} disabled={isLoadingHistory}>
              {isLoadingHistory ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Load History"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={exportHistoryCsv}
              disabled={!historyRows.length || isLoadingHistory}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="space-y-2">
            {historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No attendance history loaded yet.
              </p>
            ) : (
              historyRows.map((row) => (
                <div
                  key={row.id}
                  className="grid gap-2 rounded-md border p-3 md:grid-cols-[130px_minmax(0,1.6fr)_minmax(0,1.2fr)_110px_200px]"
                >
                  <p className="text-sm text-muted-foreground">{row.attendanceDate}</p>

                  <div>
                    <p className="text-sm font-medium">{row.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.registrationNumber ?? "No Reg. Number"}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {row.class ? `${row.class.name} (${row.class.level})` : "Class not resolved"}
                  </p>

                  <Badge
                    variant={row.status === "present" ? "default" : "destructive"}
                    className={row.status === "present" ? "bg-emerald-600 hover:bg-emerald-600" : ""}
                  >
                    {row.status}
                  </Badge>

                  <p className="text-sm text-muted-foreground">
                    {row.remarks ?? "No remarks"}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </ListView>
  );
};

export default StudentAttendancePage;
