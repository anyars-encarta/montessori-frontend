import { useMemo } from "react";
import { useNavigate } from "react-router";

import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { reports } from "@/constants";
import { useGetIdentity } from "@refinedev/core";
import { User, UserRole } from "@/types";

const ShowReports = () => {
  const navigate = useNavigate();
  const { data: loggedInUser, isLoading } = useGetIdentity<User>();
  const visibleReports = useMemo(() => {
    if (isLoading) {
      return [];
    }

    if (!loggedInUser?.role) {
      return [];
    }

    const currentRole =
      loggedInUser.role === "admin"
        ? UserRole.ADMIN
        : loggedInUser.role === "teacher"
          ? UserRole.TEACHER
          : loggedInUser.role === "staff"
            ? UserRole.STAFF
            : null;

    if (!currentRole) {
      return [];
    }

    return reports.filter((report) => report.visibleTo.includes(currentRole));
  }, [isLoading, loggedInUser?.role]);

  return (
    <ListView className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Breadcrumb />
          {!isLoading && (
            <Badge variant="outline">{visibleReports.length} Report Modules</Badge>
          )}
        </div>
        <Separator />
      </div>

      <section className="rounded-xl border p-5 sm:p-6 bg-muted/20">
        <h1 className="text-2xl font-bold tracking-tight">Reports Hub</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground ">
          Access all reporting workflows from one place. Reports marked as
          <span className="font-bold text-foreground"> Ready </span>
          open directly to a dedicated workflow. Reports marked as
          <span className="font-bold text-foreground"> Guided </span>
          provide shortcuts to the current best pages while deeper report pages
          continue to evolve.
        </p>
      </section>

      {!isLoading && <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleReports.map((report) => {
          const Icon = report.icon;

          return (
            <Card
              key={report.title}
              className="flex h-full flex-col bg-muted/20 p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-md border p-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{report.category}</Badge>
                    <Badge
                      variant={
                        report.status === "ready" ? "default" : "outline"
                      }
                    >
                      {report.status === "ready" ? "Ready" : "Guided"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
              </CardHeader>

              <CardContent className="flex h-full flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {report.summary}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {report.actions.map((action, index) => (
                    <Button
                      key={`${report.title}-${action.path}`}
                      variant={index === 0 ? "default" : "outline"}
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => navigate(action.path)}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>}

      {!isLoading && visibleReports.length === 0 && (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">No reports available for your role.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Reports are only shown to signed-in users whose role is included in each report's access list.
            </p>
          </CardContent>
        </Card>
      )}
    </ListView>
  );
};

export default ShowReports;
