import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import "./App.css";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import { dataProvider } from "./providers/data";

import {
  GraduationCap,
  Home,
  Settings,
  Users,
  Users2Icon,
  Dock,
  Clipboard,
  ClipboardCheck,
  BookOpen,
  Banknote,
  HandCoins,
  CheckSquare,
} from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";

import ListClasses from "./pages/classes/list";
import ShowClass from "./pages/classes/show";
import CreateClass from "./pages/classes/create";
import EditClass from "./pages/classes/edit";
import EnrollmentsPage from "./pages/classes/enrollments";
import EnrollmentScoresEditPage from "./pages/classes/enrollment-scores-edit";
import StudentAttendancePage from "./pages/classes/student-attendance";
import Login from "./pages/login";
import Register from "./pages/register";
import { authProvider } from "./providers/auth";
import Dashboard from "./pages/dashboard";
import ListStudents from "./pages/students/list";
import CreateStudent from "./pages/students/create";
import ShowStudent from "./pages/students/show";
import EditStudent from "./pages/students/edit";
import ListStaff from "./pages/staff/list";
import EditStaff from "./pages/staff/edit";
import CreateStaff from "./pages/staff/create";
import ShowStaff from "./pages/staff/show";
import StaffAttendancePage from "./pages/staff/staff-attendance";
import CreateUser from "./pages/users/create";
import EditUser from "./pages/users/edit";
import ShowUser from "./pages/users/show";
import ListUsers from "./pages/users/list";
import ShowSetup from "./pages/setup/show";
import CreateSetup from "./pages/setup/create";
import EditSetup from "./pages/setup/edit";
import ListFees from "./pages/fees/list";
import CreateFees from "./pages/fees/create";
import EditFees from "./pages/fees/edit";
import ShowFees from "./pages/fees/show";
import ListSubjects from "./pages/subjects/list";
import CreateSubject from "./pages/subjects/create";
import ShowSubject from "./pages/subjects/show";
import EditSubject from "./pages/subjects/edit";
import ListPayments from "./pages/payments/list";
import CreatePayment from "./pages/payments/create";
import ShowPayment from "./pages/payments/show";
import EditPayment from "./pages/payments/edit";
import ShowReports from "./pages/reports/show";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={authProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "tv94aP-lQukHU-SW9MFa",
              }}
              resources={[
                {
                  name: "dashboard",
                  list: "/",
                  meta: {
                    label: "Home",
                    icon: <Home />,
                  },
                },
                {
                  name: "classes",
                  list: "/classes",
                  create: "/classes/create",
                  show: "/classes/show/:id",
                  edit: "/classes/edit/:id",
                  meta: {
                    label: "Classes",
                    icon: <BookOpen />,
                  },
                },
                {
                  name: "subjects",
                  list: "/subjects",
                  create: "/subjects/create",
                  show: "/subjects/show/:id",
                  edit: "/subjects/edit/:id",
                  meta: {
                    label: "Subjects",
                    icon: <Clipboard />,
                  },
                },
                {
                  name: "students",
                  list: "/students",
                  create: "/students/create",
                  show: "/students/show/:id",
                  edit: "/students/edit/:id",
                  meta: {
                    label: "Students",
                    icon: <GraduationCap />,
                  },
                },
                {
                  name: "class-enrollments",
                  list: "/classes/enrollments",
                  meta: {
                    label: "Enrollments",
                    icon: <Dock />,
                  },
                },
                {
                  name: "student-attendance",
                  list: "/classes/student-attendance",
                  meta: {
                    label: "Student Attendance",
                    icon: <ClipboardCheck />,
                  },
                },
                {
                  name: "staff",
                  list: "/staff",
                  create: "/staff/create",
                  show: "/staff/show/:id",
                  edit: "/staff/edit/:id",
                  meta: {
                    label: "Staff",
                    icon: <Users2Icon />,
                  },
                },
                {
                  name: "staff-attendance",
                  list: "/staff/staff-attendance",
                  meta: {
                    label: "Staff Attendance",
                    icon: <ClipboardCheck />,
                  },
                },
                {
                  name: "payments",
                  list: "/payments",
                  create: "/payments/create",
                  show: "/payments/show/:id",
                  edit: "/payments/edit/:id",
                  meta: {
                    label: "Payments",
                    icon: <HandCoins />,
                  },
                },
                {
                  name: "users",
                  list: "/users",
                  create: "/users/create",
                  show: "/users/show/:id",
                  edit: "/users/edit/:id",
                  meta: {
                    label: "Users",
                    icon: <Users />,
                  },
                },
                {
                  name: "reports",
                  list: "/reports",
                  meta: {
                    label: "Reports",
                    icon: <CheckSquare />,
                    hide: true,
                  },
                },
                {
                  name: "setup",
                  list: "/setup",
                  create: "/setup/create",
                  edit: "/setup/edit/:id",
                  meta: {
                    label: "Setup",
                    icon: <Settings />,
                  },
                },
                {
                  name: "fees",
                  list: "/fees",
                  create: "/fees/create",
                  show: "/fees/show/:id",
                  edit: "/fees/edit/:id",
                  meta: {
                    label: "Fees",
                    icon: <Banknote />,
                    hide: true,
                  },
                },
              ]}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated key="public-routes" fallback={<Outlet />}>
                      <NavigateToResource fallbackTo="/" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Route>

                <Route
                  element={
                    <Authenticated key="private-routes" fallback={<Login />}>
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route path="/" element={<Dashboard />} />

                  <Route path="classes">
                    <Route index element={<ListClasses />} />
                    <Route path="create" element={<CreateClass />} />
                    <Route path="enrollments" element={<EnrollmentsPage />} />
                    <Route
                      path="student-attendance"
                      element={<StudentAttendancePage />}
                    />
                    <Route
                      path="enrollments/scores/:id"
                      element={<EnrollmentScoresEditPage />}
                    />
                    <Route path="show/:id" element={<ShowClass />} />
                    <Route path="edit/:id" element={<EditClass />} />
                  </Route>

                  <Route path="subjects">
                    <Route index element={<ListSubjects />} />
                    <Route path="create" element={<CreateSubject />} />
                    <Route path="show/:id" element={<ShowSubject />} />
                    <Route path="edit/:id" element={<EditSubject />} />
                  </Route>

                  <Route path="students">
                    <Route index element={<ListStudents />} />
                    <Route path="create" element={<CreateStudent />} />
                    <Route path="show/:id" element={<ShowStudent />} />
                    <Route path="edit/:id" element={<EditStudent />} />
                  </Route>

                  <Route path="staff">
                    <Route index element={<ListStaff />} />
                    <Route path="create" element={<CreateStaff />} />
                    <Route
                      path="staff-attendance"
                      element={<StaffAttendancePage />}
                    />
                    <Route path="show/:id" element={<ShowStaff />} />
                    <Route path="edit/:id" element={<EditStaff />} />
                  </Route>

                  <Route path="payments">
                    <Route index element={<ListPayments />} />
                    <Route path="create" element={<CreatePayment />} />
                    <Route path="show/:id" element={<ShowPayment />} />
                    <Route path="edit/:id" element={<EditPayment />} />
                  </Route>

                  <Route path="users">
                    <Route index element={<ListUsers />} />
                    <Route path="create" element={<CreateUser />} />
                    <Route path="show/:id" element={<ShowUser />} />
                    <Route path="edit/:id" element={<EditUser />} />
                  </Route>

                  <Route path="reports">
                    <Route index element={<ShowReports />} />
                  </Route>

                  <Route path="setup">
                    <Route index element={<ShowSetup />} />
                    <Route path="create" element={<CreateSetup />} />
                    <Route path="edit/:id" element={<EditSetup />} />
                  </Route>

                  <Route path="fees">
                    <Route index element={<ListFees />} />
                    <Route path="create" element={<CreateFees />} />
                    <Route path="edit/:id" element={<EditFees />} />
                    <Route path="show/:id" element={<ShowFees />} />
                  </Route>
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
