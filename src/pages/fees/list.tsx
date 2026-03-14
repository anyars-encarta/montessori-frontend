import { useMemo, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AcademicYearRecord, FeeRecord, FeeType } from "@/types";
import { useList } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

const feeTypeOptions: FeeType[] = ["admission", "tuition", "feeding", "other"];

const ListFees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeType, setSelectedFeeType] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");

  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 200 },
  });

  const academicYears = yearsResult.data;

  const filters = useMemo(() => {
    const values: Array<{
      field: string;
      operator: "eq" | "contains";
      value: string;
    }> = [];

    const normalizedSearch = searchQuery.trim();
    if (normalizedSearch) {
      values.push({
        field: "search",
        operator: "contains",
        value: normalizedSearch,
      });
    }

    if (selectedFeeType) {
      values.push({
        field: "feeType",
        operator: "eq",
        value: selectedFeeType,
      });
    }

    if (selectedAcademicYearId) {
      values.push({
        field: "academicYearId",
        operator: "eq",
        value: selectedAcademicYearId,
      });
    }

    return values;
  }, [searchQuery, selectedAcademicYearId, selectedFeeType]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedFeeType.length > 0 ||
    selectedAcademicYearId.length > 0;

  const feeTable = useTable<FeeRecord>({
    columns: useMemo<ColumnDef<FeeRecord>[]>(
      () => [
        {
          id: "name",
          accessorKey: "name",
          size: 180,
          header: () => <p className="column-title">Fee Name</p>,
          cell: ({ getValue }) => (
            <span className="font-medium">{getValue<string>()}</span>
          ),
        },
        {
          id: "feeType",
          accessorKey: "feeType",
          size: 110,
          header: () => <p className="column-title">Type</p>,
          cell: ({ getValue }) => (
            <Badge variant="secondary" className="capitalize">
              {getValue<string>()}
            </Badge>
          ),
        },
        {
          id: "amount",
          accessorKey: "amount",
          size: 120,
          header: () => <p className="column-title">Amount</p>,
          cell: ({ getValue }) => <span>${getValue<string>()}</span>,
        },
        {
          id: "academicYearId",
          accessorKey: "academicYearId",
          size: 110,
          header: () => <p className="column-title">Year</p>,
          cell: ({ row }) => {
            const year = academicYears.find(
              (yearRow) => yearRow.id === row.original.academicYearId,
            );
            return <span>{year?.year ?? "N/A"}</span>;
          },
        },
        {
          id: "applicableToLevel",
          accessorKey: "applicableToLevel",
          size: 140,
          header: () => <p className="column-title">Class Level</p>,
          cell: ({ getValue }) => <span>{getValue<string>() ?? "All"}</span>,
        },
        {
          id: "actions",
          size: 160,
          header: () => <p className="column-title">Actions</p>,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <ShowButton
                resource="fees"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
              >
                <ActionButton type="view" />
              </ShowButton>
              <EditButton
                resource="fees"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
              >
                <ActionButton type="update" />
              </EditButton>
              <DeleteButton
                resource="fees"
                recordItemId={row.original.id}
                variant="outline"
                size="sm"
                className="cursor-pointer"
              >
                <ActionButton type="delete" />
              </DeleteButton>
            </div>
          ),
        },
      ],
      [academicYears],
    ),
    refineCoreProps: {
      resource: "fees",
      pagination: { pageSize: 10, mode: "server" },
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

      <h1 className="page-title">Fees</h1>

      <div className="intro-row">
        <p>Manage fee structures for each academic year and class level.</p>

        <div className="actions-row">
          <div className="search-field">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Search by fee name"
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-[160px]">
            <Select
              value={selectedFeeType || "all"}
              onValueChange={(value) =>
                setSelectedFeeType(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {feeTypeOptions.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[180px]">
            <Select
              value={selectedAcademicYearId || "all"}
              onValueChange={(value) =>
                setSelectedAcademicYearId(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={String(year.id)}>
                    {year.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CreateButton resource="fees" />

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setSearchQuery("");
                setSelectedFeeType("");
                setSelectedAcademicYearId("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <DataTable table={feeTable} />
    </ListView>
  );
};

export default ListFees;