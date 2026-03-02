import ActionButton from "@/components/actionButton";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Staff } from "@/types";
import { useList } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/table-core";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

interface ClassRecord {
  id: number;
  name: string;
  level: string;
  capacity: number;
  supervisorId: number;
  createdAt: string;
  updatedAt: string;
  supervisor: Staff | null;
  subjects: Array<{
    classId: number;
    subjectId: number;
    subject: {
      id: number;
      name: string;
      code: string;
      description: string | null;
      cloudinaryImageUrl: string | null;
      imageCldPubId: string | null;
      createdAt: string;
      updatedAt: string;
    } | null;
  }>;
  enrollments: Array<{
    enrollment: {
      id: number;
      studentId: number;
      classId: number;
      academicYearId: number;
      enrollmentDate: string;
      promotionDate: string | null;
      createdAt: string;
    };
    student: {
      id: number;
      firstName: string;
      lastName: string;
    } | null;
    academicYear: {
      id: number;
      year: number;
      startDate: string;
      endDate: string;
      createdAt: string;
    } | null;
  }>;
  positions: Array<any>;
}

const ClassesList = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const searchFilter = searchQuery
    ? [
        {
          field: "name",
          operator: "contains" as const,
          value: searchQuery,
        },
      ]
    : [];

  const classTable = useTable<ClassRecord>({
    columns: useMemo<ColumnDef<ClassRecord>[]>(
      () => [
        {
          id: "name",
          accessorKey: "name",
          size: 200,
          header: () => <p className="column-title">Class Name</p>,
          cell: ({ getValue }) => (
            <span className="text-foreground font-medium">
              {getValue<string>()}
            </span>
          ),
          filterFn: "includesString",
        },
        {
          id: "level",
          accessorKey: "level",
          size: 120,
          header: () => <p className="column-title">Level</p>,
          cell: ({ getValue }) => (
            <Badge variant="secondary">{getValue<string>()}</Badge>
          ),
        },
        {
          id: "supervisor",
          accessorKey: "supervisor",
          size: 150,
          header: () => <p className="column-title">Supervisor</p>,
          cell: ({ getValue }) => {
            const supervisor = getValue<Staff | null>();
            return (
              <span className="text-foreground">
                {supervisor
                  ? `${supervisor.firstName} ${supervisor.lastName}`
                  : "Unassigned"}
              </span>
            );
          },
        },
        {
          id: "capacity",
          accessorKey: "capacity",
          size: 100,
          header: () => <p className="column-title">Capacity</p>,
          cell: ({ getValue }) => (
            <span className="text-foreground">{getValue<number>()}</span>
          ),
        },
        {
          id: "students",
          size: 100,
          header: () => <p className="column-title">Students</p>,
          cell: ({ row }) => (
            <span className="text-foreground">
              {row.original.enrollments.length}
            </span>
          ),
        },
        {
          id: "subjects",
          size: 100,
          header: () => <p className="column-title">Subjects</p>,
          cell: ({ row }) => (
            <span className="text-foreground">
              {row.original.subjects.length}
            </span>
          ),
        },
        {
          id: "actions",
          size: 140,
          header: () => <p className="column-title">Actions</p>,
          cell: ({ row }) => {
            return (
              <div className="flex items-center gap-2">
                <ShowButton
                  resource="classes"
                  recordItemId={row.original.id}
                  variant="outline"
                  size="sm"
                >
                  <ActionButton type="view" />
                </ShowButton>
                <DeleteButton
                  resource="classes"
                  recordItemId={row.original.id}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <ActionButton type="delete" />
                </DeleteButton>
              </div>
            );
          },
        },
      ],
      [],
    ),
    refineCoreProps: {
      resource: "classes",
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

      <h1 className="page-title">Classes</h1>

      <div className="intro-row">
        <p>Manage your classes, subjects and teachers.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />

            <Input
              type="text"
              placeholder="Search by class name"
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

      <DataTable table={classTable} />
    </ListView>
  );
};

export default ClassesList;