import { useMemo } from "react";
import { useNavigate } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ShowView } from "@/components/refine-ui/views/show-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useList } from "@refinedev/core";
import { AcademicYearRecord, SchoolDetailsRecord, TermRecord } from "@/types";
import { Badge } from "@/components/ui/badge";

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString();
};

const formatDiscount = (type: "value" | "percentage", amount: string) => {
  if (type === "percentage") {
    return `${amount}%`;
  }

  return `$${amount}`;
};

const ShowSetup = () => {
  const navigate = useNavigate();
  const currentCalendarYear = new Date().getFullYear();

  const { query: schoolQuery, result: schoolResult } =
    useList<SchoolDetailsRecord>({
      resource: "school-details",
      pagination: { pageSize: 50 },
    });

  const { query: yearsQuery, result: yearsResult } =
    useList<AcademicYearRecord>({
      resource: "academic-years",
      pagination: { pageSize: 200 },
    });

  const { query: termsQuery, result: termsResult } = useList<TermRecord>({
    resource: "terms",
    pagination: { pageSize: 500 },
  });

  const school = schoolResult.data[0] ?? null;
  const academicYears = yearsResult.data;
  const terms = termsResult.data;

  const sortedAcademicYears = useMemo(() => {
    return [...academicYears].sort((a, b) => {
      const aIsCurrent = a.year === String(currentCalendarYear);
      const bIsCurrent = b.year === String(currentCalendarYear);

      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;

      const aYear = Number(a.year);
      const bYear = Number(b.year);

      if (Number.isFinite(aYear) && Number.isFinite(bYear)) {
        return bYear - aYear;
      }

      return b.year.localeCompare(a.year);
    });
  }, [academicYears, currentCalendarYear]);

  const termsByAcademicYearId = useMemo(() => {
    const grouped = new Map<number, TermRecord[]>();

    for (const term of terms) {
      const existing = grouped.get(term.academicYearId) ?? [];
      existing.push(term);
      grouped.set(term.academicYearId, existing);
    }

    for (const [academicYearId, groupedTerms] of grouped.entries()) {
      grouped.set(
        academicYearId,
        groupedTerms.sort((a, b) => {
          if (a.sequenceNumber !== b.sequenceNumber) {
            return a.sequenceNumber - b.sequenceNumber;
          }

          return a.startDate.localeCompare(b.startDate);
        }),
      );
    }

    return grouped;
  }, [terms]);

  if (schoolQuery.isLoading || yearsQuery.isLoading || termsQuery.isLoading) {
    return (
      <ShowView>
        <PageLoader />
      </ShowView>
    );
  }

  return (
    <ShowView className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Breadcrumb />
          <div className="flex items-center gap-2">
            {school ? (
              <Button
                className="cursor-pointer"
                onClick={() => navigate(`/setup/edit/${school.id}`)}
              >
                Edit Setup
              </Button>
            ) : (
              <Button
                className="cursor-pointer"
                onClick={() => navigate("/setup/create")}
              >
                Create Setup
              </Button>
            )}
          </div>
        </div>
        <Separator />
      </div>

      <div className="flex flex-row gap-4 flex-wrap">
        <Button className="cursor-pointer" onClick={() => navigate("/fees")}>
          Manage Fees
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent>
          {schoolQuery.isError ? (
            <p className="text-sm text-destructive">
              Failed to load school details.
            </p>
          ) : school ? (
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt={school.name}
                  className="h-40 w-40 rounded-sm object-cover"
                />
              ) : (
                <div className="h-40 w-40 rounded-sm bg-muted flex items-center justify-center text-muted-foreground">
                  No Logo
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{school.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{school.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{school.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{school.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <p className="font-medium">{school.website || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount Type</p>
                  <p className="font-medium">{school.discountType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Discount Amount
                  </p>
                  <p className="font-medium">
                    {formatDiscount(school.discountType, school.discountAmount)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No school information found.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedAcademicYears.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No academic years configured.
            </p>
          ) : (
            sortedAcademicYears.map((year, i) => (
              <div key={year.id} className="rounded-md border p-3">
                <p className="font-medium">
                  {year.year} {i === 0 && <Badge>Current</Badge>}
                </p>

                <p className="text-sm text-muted-foreground">
                  {formatDate(year.startDate)} - {formatDate(year.endDate)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {terms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No terms configured.
            </p>
          ) : (
            sortedAcademicYears.map((year, i) => {
              const yearTerms = termsByAcademicYearId.get(year.id) ?? [];

              return (
                <div key={year.id} className="rounded-md border p-3 space-y-2">
                  <p className="font-semibold">
                    Academic Year {year.year}{" "}
                    {i === 0 && <Badge>Current</Badge>}
                  </p>

                  {yearTerms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No terms configured for this year.
                    </p>
                  ) : (
                    yearTerms.map((term) => (
                      <div key={term.id} className="rounded-md border p-3">
                        <p className="font-medium">
                          {term.name} (Term {term.sequenceNumber})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(term.startDate)} -{" "}
                          {formatDate(term.endDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </ShowView>
  );
};

export default ShowSetup;
