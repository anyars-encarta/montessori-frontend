import ActionButton from "@/components/actionButton";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Student } from "@/types";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/table-core";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const getCurrentClassName = (student: Student) => {
  const enrollments = student.enrollments ?? [];

  if (!enrollments.length) return "Unassigned";

  const latestEnrollment = enrollments.reduce((latest, current) => {
    const latestDate = new Date(latest.enrollment.enrollmentDate).getTime();
    const currentDate = new Date(current.enrollment.enrollmentDate).getTime();

    return currentDate > latestDate ? current : latest;
  });

  return latestEnrollment.class?.name ?? "Unassigned";
};

const ListStudents = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const searchFilter = searchQuery
    ? [
        {
          field: "search",
          operator: "contains" as const,
          value: searchQuery,
        },
      ]
    : [];

  const studentsTable = useTable<Student>({
    columns: useMemo<ColumnDef<Student>[]>(
      () => [
        {
          id: "name",
          size: 220,
          header: () => <p className="column-title">Student Name</p>,
          cell: ({ row }) => (
            <span className="text-foreground font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
          ),
        },
        {
          id: "registrationNumber",
          accessorKey: "registrationNumber",
          size: 130,
          header: () => <p className="column-title">Reg Number</p>,
          cell: ({ getValue }) => (
            <span className="text-foreground">{getValue<string>() ?? "N/A"}</span>
          ),
        },
        {
          id: "gender",
          accessorKey: "gender",
          size: 110,
          header: () => <p className="column-title">Gender</p>,
          cell: ({ getValue }) => {
            const value = (getValue<string | null>() ?? "N/A").toString();
            return <Badge variant="secondary">{value}</Badge>;
          },
        },
        {
          id: "admissionDate",
          accessorKey: "admissionDate",
          size: 140,
          header: () => <p className="column-title">Admission Date</p>,
          cell: ({ getValue }) => {
            const value = getValue<string>();
            const date = new Date(value);
            return (
              <span className="text-foreground">
                {Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString()}
              </span>
            );
          },
        },
        {
          id: "class",
          size: 100,
          header: () => <p className="column-title">Current Class</p>,
          cell: ({ row }) => (
            <span className="text-foreground">{getCurrentClassName(row.original)}</span>
          ),
        },
        {
          id: "status",
          accessorKey: "isActive",
          size: 110,
          header: () => <p className="column-title">Status</p>,
          cell: ({ getValue }) => {
            const isActive = Boolean(getValue<boolean | undefined>());
            return (
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            );
          },
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
    ),
    refineCoreProps: {
      resource: "students",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...searchFilter],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  return (
    <ListView>
      <Breadcrumb />

      <h1 className="page-title">Students</h1>

      <div className="intro-row">
        <p>Manage your students and enrollment records.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by name or registration number"
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <CreateButton />
          </div>
        </div>
      </div>

      <DataTable table={studentsTable} />
    </ListView>
  );
};

export default ListStudents;