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
import { ClassDetails, StudentTableRow } from "@/types";
import PageLoader from "@/components/PageLoader";

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
};

const ShowClass = () => {
  const { id } = useParams();
  const classId = id ?? "";

  const { query } = useShow<ClassDetails>({
    resource: "classes",
    id: classId,
  });

  const classDetails = query.data?.data;

  const studentColumns = useMemo<ColumnDef<StudentTableRow>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        size: 240,
        header: () => <p className="column-title">Student</p>,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              {row.original.image && (
                <AvatarImage src={row.original.image} alt={row.original.name} />
              )}
              <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col truncate">
              <span className="truncate font-medium">{row.original.name}</span>
              <span className="text-xs text-muted-foreground truncate">
                {row.original.registrationNumber ?? "N/A"}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "academicYear",
        accessorKey: "academicYear",
        size: 120,
        header: () => <p className="column-title">Year</p>,
        cell: ({ getValue }) => (
          <span className="text-foreground">{getValue<string>()}</span>
        ),
      },
      {
        id: "enrollmentDate",
        accessorKey: "enrollmentDate",
        size: 140,
        header: () => <p className="column-title">Enrollment Date</p>,
        cell: ({ getValue }) => {
          const date = new Date(getValue<string>());
          return (
            <span className="text-foreground">
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    []
  );

  const studentData: StudentTableRow[] = useMemo(
    () =>
      classDetails?.enrollments?.map((enrollment) => ({
        id: enrollment.student?.id ?? 0,
        name:
          enrollment.student?.firstName && enrollment.student?.lastName
            ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
            : "Unknown",
        registrationNumber: enrollment.student?.registrationNumber ?? null,
        academicYear: enrollment.academicYear?.year.toString() ?? "N/A",
        enrollmentDate: enrollment.enrollment.enrollmentDate,
        image: enrollment.student?.cloudinaryImageUrl ?? null,
      })) ?? [],
    [classDetails?.enrollments]
  );

  const studentsTable = useTable<StudentTableRow>({
    columns: studentColumns,
    data: studentData,
    enableSorting: true,
    enableFilters: false,
  });

  if (query.isLoading || query.isError || !classDetails) {
    return (
      <ShowView className="class-view class-show">
        <ShowViewHeader resource="classes" title="Class Details" />
        <p className="state-message">
          {query.isLoading
            ? <PageLoader />
            : query.isError
              ? "Failed to load class details."
              : "Class details not found."}
        </p>
      </ShowView>
    );
  }

  const supervisorName = classDetails.supervisor
    ? `${classDetails.supervisor.firstName} ${classDetails.supervisor.lastName}`
    : "Unassigned";

  return (
    <ShowView className="class-view class-show space-y-6">
      <ShowViewHeader resource="classes" title="Class Details" />

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{classDetails.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Level: {classDetails.level}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{classDetails.capacity} spots</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supervisor Information */}
          <div>
            <h3 className="font-semibold mb-3">👨‍🏫 Supervisor</h3>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                {classDetails.supervisor?.cloudinaryImageUrl && (
                  <AvatarImage
                    src={classDetails.supervisor.cloudinaryImageUrl}
                    alt={supervisorName}
                  />
                )}
                <AvatarFallback>{getInitials(supervisorName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{supervisorName}</p>
                <p className="text-sm text-muted-foreground">
                  {classDetails.supervisor?.email ?? "No email"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hired:{" "}
                  {classDetails.supervisor?.hireDate
                    ? new Date(classDetails.supervisor.hireDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Subjects */}
          {classDetails.subjects && classDetails.subjects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">
                📚 Subjects ({classDetails.subjects.length})
              </h3>
              <div className="grid gap-2">
                {classDetails.subjects.map((subjectRow) => (
                  <div
                    key={subjectRow.subjectId}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {subjectRow.subject?.name ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subjectRow.subject?.code ?? "N/A"}
                      </p>
                    </div>
                    {subjectRow.subject?.description && (
                      <p className="text-xs text-muted-foreground ml-2 text-right">
                        {subjectRow.subject.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Class Information */}
          <div>
            <h3 className="font-semibold mb-3">📊 Class Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                <p className="font-semibold text-lg">{classDetails.capacity}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  Enrolled Students
                </p>
                <p className="font-semibold text-lg">
                  {classDetails.enrollments.length}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Subjects</p>
                <p className="font-semibold text-lg">
                  {classDetails.subjects.length}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="font-semibold text-sm">
                  {new Date(classDetails.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrolled Students Table */}
      {classDetails.enrollments.length > 0 && (
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Enrolled Students ({classDetails.enrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable table={studentsTable} />
          </CardContent>
        </Card>
      )}
    </ShowView>
  );
};

export default ShowClass;