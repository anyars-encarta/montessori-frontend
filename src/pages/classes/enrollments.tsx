import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  EnrollmentAssessmentRow,
  TermRecord,
} from "@/types";
import { useList, useNotification, useUpdate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";

type ScoreDraft = {
  homeWork1: string;
  homeWork2: string;
  exercise1: string;
  exercise2: string;
  classTest: string;
};

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const EnrollmentsPage = () => {
  const { open } = useNotification();
  const { mutateAsync: updateRecord } = useUpdate();

  const [studentNameFilter, setStudentNameFilter] = useState("");
  const [classIdFilter, setClassIdFilter] = useState("");
  const [academicYearIdFilter, setAcademicYearIdFilter] = useState("");
  const [termIdFilter, setTermIdFilter] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<number, ScoreDraft>>({});
  const [savingAssessmentId, setSavingAssessmentId] = useState<number | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] =
    useState<ClassEnrollmentOverviewRow | null>(null);

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
              <span className="font-medium">{row.original.student.fullName}</span>
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
          accessorFn: (row) => `${row.academicYear.year}-${row.term.sequenceNumber}`,
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
              return <span className="text-muted-foreground">No assessments</span>;
            }

            const totals = assessments.reduce(
              (acc, current) => {
                acc.classTest += Number.parseFloat(current.classTest || "0") || 0;
                acc.totalMark += Number.parseFloat(current.totalMark || "0") || 0;
                return acc;
              },
              { classTest: 0, totalMark: 0 },
            );

            return (
              <div className="text-sm">
                <p>Subjects: {subjectCount}</p>
                <p>
                  Avg Class Test: {(totals.classTest / subjectCount).toFixed(2)}
                </p>
                <p>Total Score: {totals.totalMark.toFixed(2)}</p>
              </div>
            );
          },
        },
        {
          id: "enrollmentDate",
          accessorFn: (row) => row.enrollmentDate,
          header: () => <p className="column-title">Enrollment Date</p>,
          size: 140,
          cell: ({ row }) => <span>{formatDate(row.original.enrollmentDate)}</span>,
        },
        {
          id: "actions",
          header: () => <p className="column-title">Actions</p>,
          size: 130,
          cell: ({ row }) => (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedEnrollment(row.original)}
            >
              Edit Scores
            </Button>
          ),
        },
      ],
      [],
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
  const selectedClass = classes.find((classRow) => String(classRow.id) === classIdFilter) ?? null;
  const selectedAcademicYear =
    academicYears.find((year) => String(year.id) === academicYearIdFilter) ?? null;
  const enrollments = useMemo(
    () => enrollmentsTable.refineCore.tableQuery.data?.data ?? [],
    [enrollmentsTable.refineCore.tableQuery.data?.data],
  );

  const filteredTerms = useMemo(() => {
    if (!academicYearIdFilter) return terms;

    return terms.filter((term) => String(term.academicYearId) === academicYearIdFilter);
  }, [academicYearIdFilter, terms]);

  const selectedTerm = filteredTerms.find((term) => String(term.id) === termIdFilter) ?? null;

  const activeFilters = useMemo(
    () => [
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
      (
        value,
      ): value is { key: string; label: string; clear: () => void } => Boolean(value),
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
    setScoreDrafts((prev) => {
      const next = { ...prev };

      for (const enrollment of enrollments) {
        for (const assessment of enrollment.assessments) {
          if (!next[assessment.id]) {
            next[assessment.id] = {
              homeWork1: assessment.homeWork1,
              homeWork2: assessment.homeWork2,
              exercise1: assessment.exercise1,
              exercise2: assessment.exercise2,
              classTest: assessment.classTest,
            };
          }
        }
      }

      return next;
    });
  }, [enrollments]);

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

  const onScoreChange = (
    assessmentId: number,
    field: keyof ScoreDraft,
    value: string,
  ) => {
    setScoreDrafts((prev) => ({
      ...prev,
      [assessmentId]: {
        homeWork1: prev[assessmentId]?.homeWork1 ?? "",
        homeWork2: prev[assessmentId]?.homeWork2 ?? "",
        exercise1: prev[assessmentId]?.exercise1 ?? "",
        exercise2: prev[assessmentId]?.exercise2 ?? "",
        classTest: prev[assessmentId]?.classTest ?? "",
        [field]: value,
      },
    }));
  };

  const saveScores = async (assessmentId: number) => {
    const draft = scoreDrafts[assessmentId];

    if (!draft) return;

    setSavingAssessmentId(assessmentId);

    try {
      await updateRecord({
        resource: "continuous-assessments",
        id: assessmentId,
        values: {
          homeWork1: draft.homeWork1,
          homeWork2: draft.homeWork2,
          exercise1: draft.exercise1,
          exercise2: draft.exercise2,
          classTest: draft.classTest,
        },
        successNotification: false,
        errorNotification: false,
      });

      open?.({
        type: "success",
        message: "Scores updated",
      });

      await enrollmentsTable.refineCore.tableQuery.refetch();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to update scores";

      open?.({
        type: "error",
        message: "Score update failed",
        description: message,
      });
    } finally {
      setSavingAssessmentId(null);
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
        <CardContent className="grid gap-4 md:grid-cols-4">
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
            <Select value={classIdFilter || "all"} onValueChange={(value) => setClassIdFilter(value === "all" ? "" : value)}>
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
            <Select value={academicYearIdFilter || "all"} onValueChange={(value) => setAcademicYearIdFilter(value === "all" ? "" : value)}>
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
              onValueChange={(value) => setTermIdFilter(value === "all" ? "" : value)}
              disabled={!academicYearIdFilter}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    academicYearIdFilter ? "All terms" : "Select academic year first"
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

      <Dialog open={Boolean(selectedEnrollment)} onOpenChange={(open) => !open && setSelectedEnrollment(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Edit Subject Scores</DialogTitle>
            <DialogDescription>
              {selectedEnrollment
                ? `${selectedEnrollment.student.fullName} • ${selectedEnrollment.class.name} • ${selectedEnrollment.academicYear.year} • ${selectedEnrollment.term.name}`
                : "Update class and exam scores for each subject."}
            </DialogDescription>
          </DialogHeader>

          {!selectedEnrollment ? null : selectedEnrollment.assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments seeded for this enrollment.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedEnrollment.assessments.map((assessment: EnrollmentAssessmentRow) => {
                const draft = scoreDrafts[assessment.id] ?? {
                  homeWork1: assessment.homeWork1,
                  homeWork2: assessment.homeWork2,
                  exercise1: assessment.exercise1,
                  exercise2: assessment.exercise2,
                  classTest: assessment.classTest,
                };

                const isSaving = savingAssessmentId === assessment.id;

                return (
                  <div key={assessment.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-7">
                    <div className="md:col-span-2">
                      <p className="font-medium">{assessment.subjectName}</p>
                      <p className="text-xs text-muted-foreground">Total: {assessment.totalMark}</p>
                    </div>

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.homeWork1}
                      onChange={(event) =>
                        onScoreChange(assessment.id, "homeWork1", event.target.value)
                      }
                      placeholder="HW 1"
                    />

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.homeWork2}
                      onChange={(event) =>
                        onScoreChange(assessment.id, "homeWork2", event.target.value)
                      }
                      placeholder="HW 2"
                    />

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.exercise1}
                      onChange={(event) =>
                        onScoreChange(assessment.id, "exercise1", event.target.value)
                      }
                      placeholder="Ex 1"
                    />

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.exercise2}
                      onChange={(event) =>
                        onScoreChange(assessment.id, "exercise2", event.target.value)
                      }
                      placeholder="Ex 2"
                    />

                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={draft.classTest}
                      onChange={(event) =>
                        onScoreChange(assessment.id, "classTest", event.target.value)
                      }
                      placeholder="Class Test"
                    />

                    <Button
                      type="button"
                      onClick={() => saveScores(assessment.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Update"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ListView>
  );
};

export default EnrollmentsPage;
