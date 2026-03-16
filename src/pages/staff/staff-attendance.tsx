import { useMemo, useState } from "react";

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
  AttendanceStatus,
  BulkMarkResponse,
  Staff,
  StaffAttendanceHistoryResponse,
  StaffAttendanceHistoryRow,
  StaffDailyAttendanceRow,
  StaffDailyRegisterResponse,
  StaffType,
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

const formatStaffTypeLabel = (value: StaffType) =>
  value === "non_teaching" ? "Non Teaching" : "Teacher";

const StaffAttendancePage = () => {
  const { open } = useNotification();

  const [staffTypeFilter, setStaffTypeFilter] = useState("");
  const [registerSearch, setRegisterSearch] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(toIsoDate(new Date()));
  const [rows, setRows] = useState<StaffDailyAttendanceRow[]>([]);
  const [isLoadingRegister, setIsLoadingRegister] = useState(false);
  const [isSavingRegister, setIsSavingRegister] = useState(false);

  const [historyRows, setHistoryRows] = useState<StaffAttendanceHistoryRow[]>([]);
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [historyStaffId, setHistoryStaffId] = useState("");
  const [historyStaffType, setHistoryStaffType] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { pageSize: 1000 },
  });

  const staff = staffResult.data;

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

  const canLoadRegister = Boolean(attendanceDate);

  const loadRegister = async () => {
    if (!canLoadRegister) {
      open?.({
        type: "error",
        message: "Missing selection",
        description: "Select an attendance date first.",
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
        attendanceDate,
      });

      if (staffTypeFilter) params.set("staffType", staffTypeFilter);
      if (registerSearch.trim()) params.set("search", registerSearch.trim());

      const response = await fetch(
        buildApiUrl(`/staff-attendances/daily-register?${params.toString()}`),
      );

      const payload = (await response.json()) as StaffDailyRegisterResponse;

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
            : "Could not load staff register",
      });
      setRows([]);
    } finally {
      setIsLoadingRegister(false);
    }
  };

  const setStatusForRow = (staffId: number, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((row) => (row.staffId === staffId ? { ...row, status } : row)),
    );
  };

  const setRemarksForRow = (staffId: number, remarks: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.staffId === staffId
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
        description: "Load a staff register first.",
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
        description: "Mark every staff member as present or absent before saving.",
      });
      return;
    }

    setIsSavingRegister(true);

    try {
      const response = await fetch(buildApiUrl("/staff-attendances/bulk-mark"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendanceDate,
          entries: rows.map((row) => ({
            staffId: row.staffId,
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
            : "Could not save staff attendance register",
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

      if (historyFromDate) params.set("fromDate", historyFromDate);
      if (historyToDate) params.set("toDate", historyToDate);
      if (historyStaffId) params.set("staffId", historyStaffId);
      if (historyStaffType) params.set("staffType", historyStaffType);
      if (historyStatus) params.set("status", historyStatus);
      if (historySearch.trim()) params.set("search", historySearch.trim());

      const response = await fetch(
        buildApiUrl(`/staff-attendances?${params.toString()}`),
      );

      const payload = (await response.json()) as StaffAttendanceHistoryResponse;

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
            : "Could not load staff attendance history",
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
      "Staff Name",
      "Registration Number",
      "Staff Type",
      "Status",
      "Remarks",
    ];

    const rowsForCsv = historyRows.map((row) => [
      row.attendanceDate,
      row.staffName,
      row.registrationNumber ?? "",
      formatStaffTypeLabel(row.staffType),
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
    link.download = `staff-attendance-history-${toIsoDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ListView className="space-y-6">
      <Breadcrumb />

      <h1 className="page-title">Staff Attendance</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Staff Type</Label>
              <Select
                value={staffTypeFilter || "all"}
                onValueChange={(value) => setStaffTypeFilter(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="non_teaching">Non Teaching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Name or registration number"
                value={registerSearch}
                onChange={(event) => setRegisterSearch(event.target.value)}
              />
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
                  key={row.staffId}
                  className="grid gap-2 rounded-md border p-3 md:grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1.2fr)_220px]"
                >
                  <div className="text-sm text-muted-foreground">{index + 1}</div>

                  <div>
                    <p className="text-sm font-medium">{row.staffName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.registrationNumber ?? "No Reg. Number"} • {formatStaffTypeLabel(row.staffType)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.status === "present" ? "default" : "outline"}
                      onClick={() => setStatusForRow(row.staffId, "present")}
                    >
                      <Check className="h-4 w-4" />
                      Present
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={row.status === "absent" ? "destructive" : "outline"}
                      onClick={() => setStatusForRow(row.staffId, "absent")}
                    >
                      Absent
                    </Button>
                  </div>

                  <Input
                    placeholder="Optional remark"
                    value={row.remarks ?? ""}
                    onChange={(event) => setRemarksForRow(row.staffId, event.target.value)}
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
              <Label>Staff</Label>
              <Select
                value={historyStaffId || "all"}
                onValueChange={(value) => setHistoryStaffId(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  {staff.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.firstName} {item.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff Type</Label>
              <Select
                value={historyStaffType || "all"}
                onValueChange={(value) => setHistoryStaffType(value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="non_teaching">Non Teaching</SelectItem>
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

            <div className="space-y-2">
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
                  className="grid gap-2 rounded-md border p-3 md:grid-cols-[130px_minmax(0,1.5fr)_130px_110px_200px]"
                >
                  <p className="text-sm text-muted-foreground">{row.attendanceDate}</p>

                  <div>
                    <p className="text-sm font-medium">{row.staffName}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.registrationNumber ?? "No Reg. Number"}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatStaffTypeLabel(row.staffType)}
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

export default StaffAttendancePage;
