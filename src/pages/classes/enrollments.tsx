import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
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
  ClassEnrollmentOverviewRow,
  ClassRecord,
  TermRecord,
} from "@/types";
import { useList } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const EnrollmentsPage = () => {
  const navigate = useNavigate();

  const [studentNameFilter, setStudentNameFilter] = useState("");
  const [classIdFilter, setClassIdFilter] = useState("");
  const [academicYearIdFilter, setAcademicYearIdFilter] = useState("");
  const [termIdFilter, setTermIdFilter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  const filters = useMemo(() => {
    const values: Array<{
      field: string;
      operator: "eq" | "contains";
      value: string;
    }> = [];

    const normalizedStudentName = studentNameFilter.trim();
    if (normalizedStudentName) {
      values.push({
        field: "studentName",
        operator: "contains",
        value: normalizedStudentName,
      });
    }

    if (classIdFilter) {
      values.push({
        field: "classId",
        operator: "eq",
        value: classIdFilter,
      });
    }

    if (academicYearIdFilter) {
      values.push({
        field: "academicYearId",
        operator: "eq",
        value: academicYearIdFilter,
      });
    }

    if (termIdFilter) {
      values.push({
        field: "termId",
        operator: "eq",
        value: termIdFilter,
      });
    }

    return values;
  }, [academicYearIdFilter, classIdFilter, studentNameFilter, termIdFilter]);

  const enrollmentsTable = useTable<ClassEnrollmentOverviewRow>({
    columns: useMemo<ColumnDef<ClassEnrollmentOverviewRow>[]>(
      () => [
        {
          id: "student",
          accessorFn: (row) => row.student.fullName,
          header: () => <p className="column-title">Student</p>,
          size: 220,
          cell: ({ row }) => (
            <div className="flex flex-col">
              <span className="font-medium">
                {row.original.student.fullName}
              </span>
              <span className="text-xs text-muted-foreground">
                {row.original.student.registrationNumber ?? "N/A"}
              </span>
            </div>
          ),
        },
        {
          id: "className",
          accessorFn: (row) => row.class.name,
          header: () => <p className="column-title">Class</p>,
          size: 150,
          cell: ({ row }) => (
            <span>
              {row.original.class.name} ({row.original.class.level})
            </span>
          ),
        },
        {
          id: "yearTerm",
          accessorFn: (row) =>
            `${row.academicYear.year}-${row.term.sequenceNumber}`,
          header: () => <p className="column-title">Year / Term</p>,
          size: 150,
          cell: ({ row }) => (
            <span>
              {row.original.academicYear.year} / {row.original.term.name}
            </span>
          ),
        },
        {
          id: "scoresSummary",
          header: () => <p className="column-title">Scores Summary</p>,
          size: 280,
          cell: ({ row }) => {
            const assessments = row.original.assessments;
            const subjectCount = assessments.length;

            if (!subjectCount) {
              return (
                <span className="text-muted-foreground">No assessments</span>
              );
            }

            const totals = assessments.reduce(
              (acc, current) => {
                acc.totalMark +=
                  Number.parseFloat(current.totalMark || "0") || 0;
                return acc;
              },
              { classTest: 0, totalMark: 0 },
            );

            return (
              <div className="text-sm">
                <p>Subjects: {subjectCount}</p>
                <p>Total Score: {totals.totalMark.toFixed(2)}</p>
              </div>
            );
          },
        },
        {
          id: "classPosition",
          accessorFn: (row) => row.classPosition,
          header: () => <p className="column-title">Position</p>,
          size: 150,
          cell: ({ row }) => <span>{row.original.classPosition}</span>,
        },
        {
          id: "remarks",
          accessorFn: (row) => row.remarks,
          header: () => <p className="column-title">Remarks</p>,
          size: 150,
          cell: ({ row }) => <span>{row.original.remarks}</span>,
        },
        {
          id: "enrollmentDate",
          accessorFn: (row) => row.enrollmentDate,
          header: () => <p className="column-title">Enrollment Date</p>,
          size: 140,
          cell: ({ row }) => (
            <span>{formatDate(row.original.enrollmentDate)}</span>
          ),
        },
        {
          id: "actions",
          header: () => <p className="column-title">Actions</p>,
          size: 130,
          cell: ({ row }) => (
            <Button
              type="button"
              size="sm"
              className="cursor-pointer"
              variant="outline"
              onClick={() =>
                navigate(`/classes/enrollments/scores/${row.original.id}`)
              }
            >
              Edit Scores
            </Button>
          ),
        },
      ],
      [navigate],
    ),
    refineCoreProps: {
      resource: "student-class-enrollments/overview",
      pagination: { pageSize: 10, mode: "server" },
      filters: {
        permanent: [...filters],
      },
      sorters: {
        initial: [{ field: "id", order: "desc" }],
      },
    },
  });

  const classes = classesResult.data;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;
  const selectedClass =
    classes.find((classRow) => String(classRow.id) === classIdFilter) ?? null;
  const selectedAcademicYear =
    academicYears.find((year) => String(year.id) === academicYearIdFilter) ??
    null;
  const filteredTerms = useMemo(() => {
    if (!academicYearIdFilter) return terms;

    return terms.filter(
      (term) => String(term.academicYearId) === academicYearIdFilter,
    );
  }, [academicYearIdFilter, terms]);

  const selectedTerm =
    filteredTerms.find((term) => String(term.id) === termIdFilter) ?? null;

  const activeFilters = useMemo(
    () =>
      [
        studentNameFilter.trim()
          ? {
              key: "student",
              label: `Student: ${studentNameFilter.trim()}`,
              clear: () => setStudentNameFilter(""),
            }
          : null,
        selectedClass
          ? {
              key: "class",
              label: `Class: ${selectedClass.name}`,
              clear: () => setClassIdFilter(""),
            }
          : null,
        selectedAcademicYear
          ? {
              key: "year",
              label: `Year: ${selectedAcademicYear.year}`,
              clear: () => {
                setAcademicYearIdFilter("");
                setTermIdFilter("");
              },
            }
          : null,
        selectedTerm
          ? {
              key: "term",
              label: `Term: ${selectedTerm.name}`,
              clear: () => setTermIdFilter(""),
            }
          : null,
      ].filter(
        (value): value is { key: string; label: string; clear: () => void } =>
          Boolean(value),
      ),
    [
      selectedAcademicYear,
      selectedClass,
      selectedTerm,
      studentNameFilter,
      setStudentNameFilter,
      setClassIdFilter,
      setAcademicYearIdFilter,
      setTermIdFilter,
    ],
  );

  useEffect(() => {
    if (!academicYearIdFilter) return;

    const exists = terms.some(
      (term) =>
        String(term.id) === termIdFilter &&
        String(term.academicYearId) === academicYearIdFilter,
    );

    if (!exists) {
      setTermIdFilter("");
    }
  }, [academicYearIdFilter, termIdFilter, terms]);

const generateScores = () => {
    try {
        setIsGenerating(true);
        console.log("Generating Student grades...")
    } catch (e) {
    setIsGenerating(false);
        console.error(e)
    }
};

  return (
    <ListView className="space-y-6">
      <Breadcrumb />

      <h1 className="page-title">Class Enrollments</h1>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="student-search">Student Name</Label>
            <Input
              id="student-search"
              value={studentNameFilter}
              onChange={(event) => setStudentNameFilter(event.target.value)}
              placeholder="Search by first or last name"
            />
          </div>

          <div className="space-y-2">
            <Label>Class</Label>
            <Select
              value={classIdFilter || "all"}
              onValueChange={(value) =>
                setClassIdFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
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
              value={academicYearIdFilter || "all"}
              onValueChange={(value) =>
                setAcademicYearIdFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
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
              value={termIdFilter || "all"}
              onValueChange={(value) =>
                setTermIdFilter(value === "all" ? "" : value)
              }
              disabled={!academicYearIdFilter}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    academicYearIdFilter
                      ? "All terms"
                      : "Select academic year first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All terms</SelectItem>
                {filteredTerms.map((term) => (
                  <SelectItem key={term.id} value={String(term.id)}>
                    {term.name} (Term {term.sequenceNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            size="sm"
            className="cursor-pointer"
            onClick={() => generateScores()}
            disabled={
              isGenerating ||
              !classIdFilter ||
              !academicYearIdFilter ||
              !termIdFilter
            }
          >
            {isGenerating ? (
              <div className="flex gap-1 items-center">
                <span>Grading...</span>
                <Loader2 className="inline-block ml-2 animate-spin" />
              </div>
            ) : (
              "Run Grades"
            )}
          </Button>
        </CardContent>
      </Card>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-2 pr-1">
              <span>{filter.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={filter.clear}
              >
                ✕
              </Button>
            </Badge>
          ))}

          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={() => {
              setStudentNameFilter("");
              setClassIdFilter("");
              setAcademicYearIdFilter("");
              setTermIdFilter("");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      <DataTable table={enrollmentsTable} />
    </ListView>
  );
};

export default EnrollmentsPage;
