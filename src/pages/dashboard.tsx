import { useMemo } from "react";
import { useLink, useList } from "@refinedev/core";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { GraduationCap, Layers, ShieldCheck, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  Student,
  Staff,
  StudentAttendance,
  ClassRecord,
  StudentFeeRecord,
  PaymentRecord,
} from "@/types";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import FinanceChart from "@/components/FinanceChart";

const roleColors = ["#f97316", "#0ea5e9", "#22c55e", "#a855f7"];

const Dashboard = () => {
  const Link = useLink();
  const { query: studentsQuery } = useList<Student>({
    resource: "students",
    pagination: { mode: "off" },
  });

  const { query: staffQuery } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  //   resource: "subjects",
  //   pagination: { mode: "off" },
  // });

  const { query: classesQuery } = useList<ClassRecord>({
    resource: "classes",
    pagination: { mode: "off" },
  });

  const { query: studentAttendanceQuery } = useList<StudentAttendance>({
    resource: "student-attendances",
    pagination: { mode: "off" },
  });

  const { query: studentFeesQuery } = useList<StudentFeeRecord>({
    resource: "student-fees/yearly-summary",
    pagination: { mode: "off" },
  });

  const { query: studentPaymentsQuery } = useList<PaymentRecord>({
    resource: "payments/yearly-summary",
    pagination: { mode: "off" },
  });

  const students = useMemo(
    () => studentsQuery.data?.data ?? [],
    [studentsQuery.data?.data],
  );
  const staff = useMemo(
    () => staffQuery.data?.data ?? [],
    [staffQuery.data?.data],
  );

  const classes = useMemo(
    () => classesQuery.data?.data ?? [],
    [classesQuery.data?.data],
  );

  const studentsAttendances = useMemo(
    () => studentAttendanceQuery.data?.data ?? [],
    [studentAttendanceQuery.data?.data],
  );

  const studentsByGender = useMemo(() => {
    const counts = students.reduce<Record<string, number>>((acc, student) => {
      const gender = student.gender ?? "unknown";
      const active = student.isActive ?? false;
      if (active) {
        acc[gender] = (acc[gender] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts).map(([gender, total]) => ({ gender, total }));
  }, [students]);

  const boys = useMemo(
    () => studentsByGender.find((item) => item.gender === "male")?.total ?? 0,
    [studentsByGender],
  );

  const girls = useMemo(
    () => studentsByGender.find((item) => item.gender === "female")?.total ?? 0,
    [studentsByGender],
  );

  const newestStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [students]);

  const newestTeachers = useMemo(() => {
    return staff
      .filter((staffMember) => staffMember.staffType === "teacher")
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [staff]);

  const kpis = [
    {
      label: "Total Students",
      value: students.filter((student) => student.isActive).length,
      icon: Users,
      accent: "text-blue-600",
    },
    {
      label: "Teachers",
      value: staff.filter((staffMember) => staffMember.staffType === "teacher")
        .length,
      icon: GraduationCap,
      accent: "text-emerald-600",
    },
    {
      label: "Other Staff",
      value: staff.filter(
        (staffMember) => staffMember.staffType === "non_teaching",
      ).length,
      icon: ShieldCheck,
      accent: "text-amber-600",
    },
    {
      label: "Classes",
      value: classes.length,
      icon: Layers,
      accent: "text-rose-600",
    },
  ];

  const data = useMemo(
    () => [
      {
        name: "Boys",
        count: boys,
        pv: 2400,
        fill: roleColors[0 % roleColors.length],
      },
      {
        name: "Girls",
        count: girls,
        pv: 4800,
        fill: roleColors[1 % roleColors.length],
      },
      {
        name: "Total",
        count: boys + girls,
        pv: 4800,
        fill: roleColors[2 % roleColors.length],
      },
    ],
    [boys, girls],
  );

  const studentFees = useMemo(
    () => studentFeesQuery.data?.data ?? [],
    [studentFeesQuery.data?.data],
  );
  const studentPayments = useMemo(
    () => studentPaymentsQuery.data?.data ?? [],
    [studentPaymentsQuery.data?.data],
  );

  const user = localStorage.getItem("user");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="page-title">Dashboard</h1>
          <span className="text-primary">
            Welcome, {user ? JSON.parse(user).name : "Guest"}
          </span>
        </div>
        <p className="text-muted-foreground">
          A quick snapshot of the latest activity and key metrics.
        </p>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border border-border bg-muted/20 p-4 hover:border-primary/40 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {kpi.label}
                  </p>
                  <kpi.icon className={`h-4 w-4 ${kpi.accent}`} />
                </div>
                <div className="mt-2 text-2xl font-semibold">{kpi.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Students By Gender</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full h-72">
              <ResponsiveContainer>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="100%"
                  barSize={32}
                  data={data}
                >
                  <RadialBar background dataKey="count" />
                </RadialBarChart>
              </ResponsiveContainer>

              <img
                src="/maleFemale.png"
                alt="maleFemale"
                width={50}
                height={50}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {studentsByGender.map((entry, index) => (
                <span
                  key={entry.gender}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: roleColors[index % roleColors.length],
                    }}
                  />
                  {entry.gender.charAt(0).toUpperCase() +
                    entry.gender.slice(1).toLowerCase()}{" "}
                  · {entry.total}
                </span>
              ))}

              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: roleColors[2 % roleColors.length],
                  }}
                />
                Total · {boys + girls}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>New Students (last 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {newestStudents.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Most recent students enrolled
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>New Teachers (last 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">
                {newestTeachers.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Most recent teachers added
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Weekly Attendance
            </h3>
            <div className="h-80">
              <AttendanceChartContainer
                attendances={studentsAttendances}
                roleColors={roleColors}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Finance
            </h3>
            <div className="h-80">
              <FinanceChart fees={studentFees} payments={studentPayments} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Newest Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newestStudents.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent students.
              </p>
            )}
            {newestStudents.map((item, index) => (
              <Link
                key={item.id}
                to={`/students/show/${item.id}`}
                className="flex items-center justify-between rounded-md border border-transparent px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {item.firstName + " " + item.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.enrollments?.[0]?.class?.name ?? "No class"} ·{" "}
                      {item.enrollments?.[0]?.supervisor
                        ? `${item.enrollments[0].supervisor.firstName} ${item.enrollments[0].supervisor.lastName}`
                        : "No teacher"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">New</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Newest Teachers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newestTeachers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent teachers.
              </p>
            )}
            {newestTeachers.map((teacher, index) => (
              <Link
                key={teacher.id}
                to={`/staff/show/${teacher.id}`}
                className="flex items-center justify-between rounded-md border border-transparent px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {teacher.firstName + " " + teacher.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {teacher.email}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">New</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <Separator />
    </div>
  );
};

export default Dashboard;
