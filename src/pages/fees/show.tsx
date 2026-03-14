import { useMemo } from "react";
import { useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ShowView } from "@/components/refine-ui/views/show-view";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AcademicYearRecord, FeeRecord } from "@/types";
import { useBack, useList, useOne } from "@refinedev/core";
import { Button } from "@/components/ui/button";

const ShowFees = () => {
  const back = useBack();
  const { id } = useParams();
  const feeId = id ?? "";

  const { query: feeQuery } = useOne<FeeRecord>({
    resource: "fees",
    id: feeId,
    queryOptions: {
      enabled: Boolean(feeId),
    },
  });

  const { result: yearsResult } = useList<AcademicYearRecord>({
    resource: "academic-years",
    pagination: { pageSize: 200 },
  });

  const fee = feeQuery.data?.data ?? null;
  const academicYears = yearsResult.data;

  const academicYear = useMemo(() => {
    if (!fee) return null;
    return academicYears.find((year) => year.id === fee.academicYearId) ?? null;
  }, [academicYears, fee]);

  if (feeQuery.isLoading) {
    return (
      <ShowView>
        <Breadcrumb />
        <PageLoader />
      </ShowView>
    );
  }

  if (feeQuery.isError || !fee) {
    return (
      <ShowView>
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load fee details.</p>
      </ShowView>
    );
  }

  return (
    <ShowView className="space-y-6">
      <Breadcrumb />

      <div className="intro-row">
        <h1 className="page-title">Fee Details</h1>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{fee.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Fee Type</p>
            <Badge variant="secondary" className="capitalize mt-1">
              {fee.feeType}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-medium">${fee.amount}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Academic Year</p>
            <p className="font-medium">{academicYear?.year ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Applicable Level</p>
            <p className="font-medium">
              {fee.applicableToLevel ?? "All Levels"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="font-medium">{fee.description ?? "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </ShowView>
  );
};

export default ShowFees;
