import { useShow } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useParams } from "react-router";

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
  StudentEnrollmentRow,
  StudentPaymentRow,
  StudentSiblingRow,
} from "@/types";
import PageLoader from "@/components/PageLoader";

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

const ShowStudent = () => {
  const { id } = useParams();
  const studentId = id ?? "";

  const { query } = useShow<Student>({
    resource: "students",
    id: studentId,
  });

  const student = query.data?.data;

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
    ],
    [],
  );

  const paymentColumns = useMemo<ColumnDef<StudentPaymentRow>[]>(
    () => [
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
        id: "paymentMethod",
        accessorKey: "paymentMethod",
        size: 120,
        header: () => <p className="column-title">Method</p>,
      },
      {
        id: "feeName",
        accessorKey: "feeName",
        size: 160,
        header: () => <p className="column-title">Fee</p>,
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
        id: "reference",
        accessorKey: "reference",
        size: 130,
        header: () => <p className="column-title">Reference</p>,
      },
    ],
    [],
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
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relation.parent.email ??
                          relation.parent.phone ??
                          "No contact"}
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

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Detailed Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">
              Enrollments ({student.enrollments.length})
            </h3>
            <DataTable table={enrollmentsTable} />
          </div>

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
    </ShowView>
  );
};

export default ShowStudent;
