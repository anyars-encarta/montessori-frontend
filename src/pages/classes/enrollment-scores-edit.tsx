import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ClassEnrollmentOverviewRow,
  EnrollmentAssessmentRow,
  ScoreDraft,
} from "@/types";
import { useList, useNotification, useUpdate } from "@refinedev/core";
import { Loader2 } from "lucide-react";

const EnrollmentScoresEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { open } = useNotification();
  const { mutateAsync: updateRecord } = useUpdate();

  const [scoreDrafts, setScoreDrafts] = useState<Record<number, ScoreDraft>>(
    {},
  );
  const [savingAssessmentId, setSavingAssessmentId] = useState<number | null>(
    null,
  );
  const [generalCommentsDraft, setGeneralCommentsDraft] = useState<string>("");
  const [isSavingGeneralComments, setIsSavingGeneralComments] = useState(false);

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

  const assessments = useMemo(
    () => enrollment?.assessments ?? [],
    [enrollment],
  );

  useEffect(() => {
    if (enrollment?.generalComments) {
      setGeneralCommentsDraft(enrollment.generalComments);
    } else {
      setGeneralCommentsDraft("");
    }
  }, [enrollment?.id]);

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
        classMark: prev[assessment.id]?.classMark ?? assessment.classMark,
        examMark: prev[assessment.id]?.examMark ?? assessment.examMark,
        [field]: value,
      },
    }));
  };

  const saveScores = async (
    assessment: EnrollmentAssessmentRow,
    subjectName: string,
  ) => {
    const draft = scoreDrafts[assessment.id] ?? {
      homeWork1: assessment.homeWork1,
      homeWork2: assessment.homeWork2,
      exercise1: assessment.exercise1,
      exercise2: assessment.exercise2,
      classTest: assessment.classTest,
      classMark: assessment.classMark,
      examMark: assessment.examMark,
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
          examMark: draft.examMark,
        },
        successNotification: false,
        errorNotification: false,
      });

      open?.({ type: "success", message: `${subjectName} Scores updated` });
      await query.refetch();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to update scores";

      open?.({
        type: "error",
        message: `${subjectName} Score update failed`,
        description: message,
      });
    } finally {
      setSavingAssessmentId(null);
    }
  };

  const saveGeneralComments = async () => {
    if (!enrollment) return;

    setIsSavingGeneralComments(true);

    try {
      await updateRecord({
        resource: "student-class-enrollments",
        id: enrollment.id,
        values: {
          generalComments: generalCommentsDraft || null,
        },
        successNotification: false,
        errorNotification: false,
      });

      open?.({ type: "success", message: "General comments updated" });
      await query.refetch();
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Failed to update general comments";

      open?.({
        type: "error",
        message: "Failed to update general comments",
        description: message,
      });
    } finally {
      setIsSavingGeneralComments(false);
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
            <p className="text-sm text-muted-foreground">
              Enrollment record not found.
            </p>
            <Button className="cursor-pointer" onClick={() => navigate("/classes/enrollments")}>
              Back to Enrollments
            </Button>
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
            {enrollment.student.fullName} • {enrollment.class.name} •{" "}
            {enrollment.academicYear.year} • {enrollment.term.name}
          </p>
        </div>

        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/classes/enrollments")}
        >
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assessments records for this enrollment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-2 font-medium">Subject</th>
                    <th className="p-2 font-medium">Home Work 1</th>
                    <th className="p-2 font-medium">Home Work 2</th>
                    <th className="p-2 font-medium">Exercise 1</th>
                    <th className="p-2 font-medium">Exercise 2</th>
                    <th className="p-2 font-medium">Class Test</th>
                    <th className="p-2 font-medium">Class Score</th>
                    <th className="p-2 font-medium">Exam Score</th>
                    <th className="p-2 font-medium">Total Score</th>
                    <th className="p-2 font-medium">Grade</th>
                    <th className="p-2 font-medium">Position</th>
                    <th className="p-2 font-medium">Remarks</th>
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
                      classMark: assessment.classMark,
                      examMark: assessment.examMark,
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
                              onScoreChange(
                                assessment,
                                "homeWork1",
                                event.target.value,
                              )
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
                              onScoreChange(
                                assessment,
                                "homeWork2",
                                event.target.value,
                              )
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
                              onScoreChange(
                                assessment,
                                "exercise1",
                                event.target.value,
                              )
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
                              onScoreChange(
                                assessment,
                                "exercise2",
                                event.target.value,
                              )
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
                              onScoreChange(
                                assessment,
                                "classTest",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 font-medium">
                          {assessment.classMark}
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={draft.examMark}
                            onChange={(event) =>
                              onScoreChange(
                                assessment,
                                "examMark",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="p-2 font-medium">
                          {assessment.totalMark}
                        </td>
                        <td className="p-2 font-medium">
                          {assessment.grade}
                        </td>
                        <td className="p-2 font-medium">
                          {assessment.subjectPosition}
                        </td>
                        <td className="p-2 font-medium">
                          {assessment.remarks}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => saveScores(assessment, assessment.subjectName)}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <div className="flex gap-1 items-center">
                                <Loader2 className="inline-block ml-2 animate-spin" />
                              </div>
                            ) : (
                              "Update"
                            )}
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

      <Card>
        <CardHeader>
          <CardTitle>General Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter general comments about this student's enrollment..."
            value={generalCommentsDraft || enrollment?.generalComments || ""}
            onChange={(event) => setGeneralCommentsDraft(event.target.value)}
            rows={6}
            className="resize-none"
          />
          <Button
            className="cursor-pointer"
            onClick={saveGeneralComments}
            disabled={isSavingGeneralComments}
          >
            {isSavingGeneralComments ? (
              <div className="flex gap-2 items-center">
                <Loader2 className="inline-block animate-spin w-4 h-4" />
                <span>Saving...</span>
              </div>
            ) : (
              "Save Comments"
            )}
          </Button>
        </CardContent>
      </Card>
    </EditView>
  );
};

export default EnrollmentScoresEditPage;
