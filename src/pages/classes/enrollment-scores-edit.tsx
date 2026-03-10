import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ClassEnrollmentOverviewRow,
  EnrollmentAssessmentRow,
  ScoreDraft,
} from "@/types";
import { useList, useNotification, useUpdate } from "@refinedev/core";

const EnrollmentScoresEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { open } = useNotification();
  const { mutateAsync: updateRecord } = useUpdate();

  const [scoreDrafts, setScoreDrafts] = useState<Record<number, ScoreDraft>>({});
  const [savingAssessmentId, setSavingAssessmentId] = useState<number | null>(null);

  const { query, result } = useList<ClassEnrollmentOverviewRow>({
    resource: "student-class-enrollments/overview",
    pagination: { pageSize: 1 },
    filters: id
      ? [
          {
            field: "enrollmentId",
            operator: "eq",
            value: id,
          },
        ]
      : [],
  });

  const enrollment = result.data[0] ?? null;

  const assessments = useMemo(() => enrollment?.assessments ?? [], [enrollment]);

  const onScoreChange = (
    assessment: EnrollmentAssessmentRow,
    field: keyof ScoreDraft,
    value: string,
  ) => {
    setScoreDrafts((prev) => ({
      ...prev,
      [assessment.id]: {
        homeWork1: prev[assessment.id]?.homeWork1 ?? assessment.homeWork1,
        homeWork2: prev[assessment.id]?.homeWork2 ?? assessment.homeWork2,
        exercise1: prev[assessment.id]?.exercise1 ?? assessment.exercise1,
        exercise2: prev[assessment.id]?.exercise2 ?? assessment.exercise2,
        classTest: prev[assessment.id]?.classTest ?? assessment.classTest,
        [field]: value,
      },
    }));
  };

  const saveScores = async (assessment: EnrollmentAssessmentRow) => {
    const draft = scoreDrafts[assessment.id] ?? {
      homeWork1: assessment.homeWork1,
      homeWork2: assessment.homeWork2,
      exercise1: assessment.exercise1,
      exercise2: assessment.exercise2,
      classTest: assessment.classTest,
    };

    setSavingAssessmentId(assessment.id);

    try {
      await updateRecord({
        resource: "continuous-assessments",
        id: assessment.id,
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

      open?.({ type: "success", message: "Scores updated" });
      await query.refetch();
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

  if (query.isLoading) {
    return (
      <EditView>
        <PageLoader />
      </EditView>
    );
  }

  if (!enrollment) {
    return (
      <EditView className="space-y-4">
        <Breadcrumb />
        <h1 className="page-title">Edit Subject Scores</h1>
        <Card>
          <CardContent className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">Enrollment record not found.</p>
            <Button onClick={() => navigate("/classes/enrollments")}>Back to Enrollments</Button>
          </CardContent>
        </Card>
      </EditView>
    );
  }

  return (
    <EditView className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Edit Subject Scores</h1>
          <p className="text-sm text-muted-foreground">
            {enrollment.student.fullName} • {enrollment.class.name} • {enrollment.academicYear.year} • {enrollment.term.name}
          </p>
        </div>

        <Button variant="outline" onClick={() => navigate("/classes/enrollments")}>Back</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments records for this enrollment.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 font-medium">Subject</th>
                    <th className="p-2 font-medium">HomeWork 1</th>
                    <th className="p-2 font-medium">HomeWork 2</th>
                    <th className="p-2 font-medium">Exercise 1</th>
                    <th className="p-2 font-medium">Exercise 2</th>
                    <th className="p-2 font-medium">Class Test</th>
                    <th className="p-2 font-medium">Total Marks</th>
                    <th className="p-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => {
                    const draft = scoreDrafts[assessment.id] ?? {
                      homeWork1: assessment.homeWork1,
                      homeWork2: assessment.homeWork2,
                      exercise1: assessment.exercise1,
                      exercise2: assessment.exercise2,
                      classTest: assessment.classTest,
                    };

                    const isSaving = savingAssessmentId === assessment.id;

                    return (
                      <tr key={assessment.id} className="border-b">
                        <td className="p-2">{assessment.subjectName}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.homeWork1}
                            onChange={(event) =>
                              onScoreChange(assessment, "homeWork1", event.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.homeWork2}
                            onChange={(event) =>
                              onScoreChange(assessment, "homeWork2", event.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.exercise1}
                            onChange={(event) =>
                              onScoreChange(assessment, "exercise1", event.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.exercise2}
                            onChange={(event) =>
                              onScoreChange(assessment, "exercise2", event.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.classTest}
                            onChange={(event) =>
                              onScoreChange(assessment, "classTest", event.target.value)
                            }
                          />
                        </td>
                        <td className="p-2 font-medium">{assessment.totalMark}</td>
                        <td className="p-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveScores(assessment)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Update"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </EditView>
  );
};

export default EnrollmentScoresEditPage;
