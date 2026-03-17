import { useNavigate } from "react-router";
import {
    BarChart3,
    BookOpen,
    BriefcaseBusiness,
    CalendarCheck2,
    ChartNoAxesCombined,
    Coins,
    FileBarChart2,
    Landmark,
    Layers,
} from "lucide-react";

import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { ListView } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReportCard } from "@/types";

const reports: ReportCard[] = [
    {
        title: "Class Report",
        summary:
            "Class-level summary and enrollment totals by gender, with detailed enrollment records per class.",
        category: "Academic",
        status: "guided",
        icon: Layers,
        actions: [
            { label: "Open Classes", path: "/classes" },
            { label: "Open Enrollment Details", path: "/classes/enrollments" },
        ],
    },
    {
        title: "Enrollments Report",
        summary:
            "Summary and detailed enrollment report with filters for academic year, term, and class.",
        category: "Academic",
        status: "ready",
        icon: FileBarChart2,
        actions: [{ label: "Open Enrollments", path: "/classes/enrollments" }],
    },
    {
        title: "Student Attendance Report",
        summary:
            "Daily register, attendance history, and CSV export for student attendance tracking.",
        category: "Attendance",
        status: "ready",
        icon: CalendarCheck2,
        actions: [
            { label: "Open Student Attendance", path: "/classes/student-attendance" },
        ],
    },
    {
        title: "Staff Attendance Report",
        summary:
            "Daily register, attendance history, and CSV export for staff attendance insights.",
        category: "Attendance",
        status: "ready",
        icon: BriefcaseBusiness,
        actions: [{ label: "Open Staff Attendance", path: "/staff/staff-attendance" }],
    },
    {
        title: "Income and Expenditure Report",
        summary:
            "Use payments and fee records to review incoming cashflow and compare against billed amounts.",
        category: "Finance",
        status: "guided",
        icon: Landmark,
        actions: [
            { label: "Open Payments", path: "/payments" },
            { label: "Open Fees", path: "/fees" },
        ],
    },
    {
        title: "Terminal Report",
        summary:
            "Use term setup and enrollment/attendance pages to analyze results for a specific term.",
        category: "Academic",
        status: "guided",
        icon: BookOpen,
        actions: [
            { label: "Open Setup (Terms)", path: "/setup" },
            { label: "Open Enrollments", path: "/classes/enrollments" },
        ],
    },
    {
        title: "Subject Performance Analysis",
        summary:
            "Analyze student performance by subject from enrollment workflows and class/subject context.",
        category: "Analytics",
        status: "guided",
        icon: BarChart3,
        actions: [
            { label: "Open Subjects", path: "/subjects" },
            { label: "Open Enrollments", path: "/classes/enrollments" },
        ],
    },
    {
        title: "Revenue Report",
        summary:
            "Track total collections, payment methods, and trends from payment records.",
        category: "Finance",
        status: "ready",
        icon: Coins,
        actions: [{ label: "Open Payments", path: "/payments" }],
    },
    {
        title: "Fees Summary Report",
        summary:
            "Review fee configuration and scope by fee type, academic year, term, and class level.",
        category: "Finance",
        status: "ready",
        icon: ChartNoAxesCombined,
        actions: [{ label: "Open Fees", path: "/fees" }],
    },
];

const ShowReports = () => {
    const navigate = useNavigate();

    return (
        <ListView className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <Breadcrumb />
                    <Badge variant="outline">9 Report Modules</Badge>
                </div>
                <Separator />
            </div>

            <section className="rounded-xl border bg-card p-5 sm:p-6">
                <h1 className="text-2xl font-bold tracking-tight">Reports Hub</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Access all reporting workflows from one place. Reports marked as
                    <span className="font-medium text-foreground"> Ready </span>
                    open directly to a dedicated workflow. Reports marked as
                    <span className="font-medium text-foreground"> Guided </span>
                    provide shortcuts to the current best pages while deeper report pages
                    continue to evolve.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;

                    return (
                        <Card key={report.title} className="flex h-full flex-col">
                            <CardHeader className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="rounded-md border p-2 text-muted-foreground">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{report.category}</Badge>
                                        <Badge
                                            variant={report.status === "ready" ? "default" : "outline"}
                                        >
                                            {report.status === "ready" ? "Ready" : "Guided"}
                                        </Badge>
                                    </div>
                                </div>
                                <CardTitle className="text-lg">{report.title}</CardTitle>
                            </CardHeader>

                            <CardContent className="flex h-full flex-col justify-between gap-4">
                                <p className="text-sm text-muted-foreground">{report.summary}</p>

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
            </section>
        </ListView>
    );
};

export default ShowReports;