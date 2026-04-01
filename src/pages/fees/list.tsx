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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BACKEND_BASE_URL } from "@/constants";
import { AcademicYearRecord, ClassRecord, FeeRecord, FeeType, TermRecord } from "@/types";
import { useList, useBack } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";

const feeTypeOptions: FeeType[] = ["admission", "tuition", "feeding", "other"];

type PaginatedListResponse<T> = {
  data?: T[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const ListFees = () => {
  const back = useBack();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeeType, setSelectedFeeType] = useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedApplicableTermId, setSelectedApplicableTermId] = useState("");
  const [selectedClassLevel, setSelectedClassLevel] = useState("");
  const [classes, setClasses] = useState<ClassRecord[]>([]);

  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { mode: "off" },
  });

  const { result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { mode: "off" },
  });

  useEffect(() => {
    let isDisposed = false;

    const fetchAllClasses = async () => {
      const pageSize = 100;
      let currentPage = 1;
      let totalPages = 1;
      const allRows: ClassRecord[] = [];

      while (currentPage <= totalPages) {
        const response = await fetch(
          `${BACKEND_BASE_URL}/classes?page=${currentPage}&limit=${pageSize}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch classes page ${currentPage}`);
        }

        const payload = (await response.json()) as PaginatedListResponse<ClassRecord>;
        allRows.push(...(payload.data ?? []));

        const nextTotalPages = payload.pagination?.totalPages;
        totalPages =
          typeof nextTotalPages === "number" && nextTotalPages > 0
            ? nextTotalPages
            : currentPage;
        currentPage += 1;
      }

      if (!isDisposed) {
        const uniqueById = Array.from(
          new Map(allRows.map((row) => [row.id, row])).values(),
        );
        setClasses(uniqueById);
      }
    };

    void fetchAllClasses().catch(() => {
      if (!isDisposed) {
        setClasses([]);
      }
    });

    return () => {
      isDisposed = true;
    };
  }, []);

  const academicYears = yearsResult.data;
  const terms = termsResult.data;

  const classLevels = useMemo(() => {
    return Array.from(new Set(classes.map((classRow) => classRow.level))).sort(
      (a, b) => a.localeCompare(b),
    );
  }, [classes]);

  const filteredTerms = useMemo(() => {
    if (!selectedAcademicYearId) {
      return terms;
    }

    const selectedYearId = Number.parseInt(selectedAcademicYearId, 10);
    if (!Number.isFinite(selectedYearId)) {
      return terms;
    }

    return terms.filter((term) => term.academicYearId === selectedYearId);
  }, [selectedAcademicYearId, terms]);

  useEffect(() => {
    if (!selectedApplicableTermId) {
      return;
    }

    const selectedTermStillVisible = filteredTerms.some(
      (term) => String(term.id) === selectedApplicableTermId,
    );

    if (!selectedTermStillVisible) {
      setSelectedApplicableTermId("");
    }
  }, [filteredTerms, selectedApplicableTermId]);

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

    if (selectedApplicableTermId) {
      values.push({
        field: "applicableTermId",
        operator: "eq",
        value: selectedApplicableTermId,
      });
    }

    if (selectedClassLevel) {
      values.push({
        field: "applicableToLevel",
        operator: "eq",
        value: selectedClassLevel,
      });
    }

    return values;
  }, [
    searchQuery,
    selectedAcademicYearId,
    selectedApplicableTermId,
    selectedFeeType,
    selectedClassLevel,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedFeeType.length > 0 ||
    selectedAcademicYearId.length > 0 ||
    selectedApplicableTermId.length > 0 ||
    selectedClassLevel.length > 0;

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
          id: "applicableTermId",
          accessorKey: "applicableTermId",
          size: 150,
          header: () => <p className="column-title">Applicable Term</p>,
          cell: ({ row }) => {
            const term = terms.find((termRow) => termRow.id === row.original.applicableTermId);
            return <span>{term?.name ?? "All Terms"}</span>;
          },
        },
        {
          id: "applyOnce",
          accessorKey: "applyOnce",
          size: 140,
          header: () => <p className="column-title">Billing</p>,
          cell: ({ row }) =>
            row.original.applyOnce ? (
              <Badge variant="secondary">One-time</Badge>
            ) : (
              <Badge variant="outline">Recurring</Badge>
            ),
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
      [academicYears, terms],
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

      <div className="intro-row">
        <h1 className="page-title">Fees</h1>

        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <div className="intro-row">
        <p>Manage fees for each academic year and class level.</p>

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
              onValueChange={(value) => {
                const nextYearId = value === "all" ? "" : value;
                setSelectedAcademicYearId(nextYearId);
              }}
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

          <div className="w-full sm:w-[180px]">
            <Select
              value={selectedApplicableTermId || "all"}
              onValueChange={(value) =>
                setSelectedApplicableTermId(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {filteredTerms.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-[180px]">
            <Select
              value={selectedClassLevel || "all"}
              onValueChange={(value) =>
                setSelectedClassLevel(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {classLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
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
                setSelectedApplicableTermId("");
                setSelectedClassLevel("");
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
