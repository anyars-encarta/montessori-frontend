import { useMemo } from "react";
import { useParams } from "react-router";

import PageLoader from "@/components/PageLoader";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ShowView } from "@/components/refine-ui/views/show-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Staff, StaffSubjectAssignment } from "@/types";
import { useBack, useList, useOne } from "@refinedev/core";
import {
  CalendarDays,
  CheckCircle2,
  Hash,
  Mail,
  Phone,
  UserRound,
  Users,
  XCircle,
  MapPin,
} from "lucide-react";

type StaffWithSubjects = Staff & {
  subjects?: StaffSubjectAssignment[];
};

const formatDate = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

const ShowStaff = () => {
  const back = useBack();
  const { id } = useParams();
  const staffId = id ?? "";

  const { query } = useOne<StaffWithSubjects>({
    resource: "staff",
    id: staffId,
    queryOptions: {
      enabled: Boolean(staffId),
    },
  });

  const { result: staffListResult } = useList<StaffWithSubjects>({
    resource: "staff",
    pagination: { pageSize: 500 },
  });

  const staff = query.data?.data;

  const subjectNames = useMemo(() => {
    if (!staff) return [];
    const source =
      staffListResult.data.find((record) => record.id === staff.id)?.subjects ?? staff.subjects ?? [];
    return source
      .map((assignment) => assignment.subject?.name)
      .filter((value): value is string => Boolean(value));
  }, [staff, staffListResult.data]);

  const initials = `${staff?.firstName?.[0] ?? ""}${staff?.lastName?.[0] ?? ""}`.toUpperCase();

  if (query.isLoading) {
    return (
      <ShowView className="class-view">
        <Breadcrumb />
        <PageLoader />
      </ShowView>
    );
  }

  if (query.isError || !staff) {
    return (
      <ShowView className="class-view">
        <Breadcrumb />
        <p className="text-sm text-destructive">Failed to load staff details.</p>
        <Button onClick={back} variant="outline" type="button">
          Go Back
        </Button>
      </ShowView>
    );
  }

  return (
    <ShowView className="class-view">
      <Breadcrumb />

      <h1 className="page-title">Staff Details</h1>

      <div className="intro-row">
        <p>View staff profile and assignment information.</p>
        <Button onClick={back} className="cursor-pointer" type="button">
          Go Back
        </Button>
      </div>

      <Separator />

      <div className="grid gap-4 my-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border">
                <AvatarImage src={staff.cloudinaryImageUrl ?? ""} alt="Staff profile" />
                <AvatarFallback>{initials || "ST"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">
                  {staff.firstName} {staff.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{toTitleCase(staff.staffType)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {staff.isActive ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-red-600" />
                  <span>Inactive</span>
                </>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <UserRound className="size-4" />
                <span>Gender: {toTitleCase(staff.gender)}</span>
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                <span>Hire Date: {formatDate(staff.hireDate)}</span>
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4" />
                <span>Date of Birth: {formatDate(staff.dateOfBirth)}</span>
              </p>
              <p className="flex items-center gap-2">
                <Hash className="size-4" />
                <span>Reg No: {staff.registrationNumber ?? "N/A"}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Contact & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <Mail className="size-4" />
                  {staff.email ?? "N/A"}
                </p>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <Phone className="size-4" />
                  {staff.phone ?? "N/A"}
                </p>
              </div>

              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="size-4" />
                  {staff.address ?? "N/A"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="size-4" />
                Assigned Subjects
              </p>

              {staff.staffType !== "teacher" ? (
                <p className="text-sm text-muted-foreground">
                  Subject assignments are available for teachers only.
                </p>
              ) : subjectNames.length ? (
                <div className="flex flex-wrap gap-2">
                  {subjectNames.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects assigned.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ShowView>
  );
};

export default ShowStaff