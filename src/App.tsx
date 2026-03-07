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
  BookOpen,
  GraduationCap,
  Home,
  Users,
  Users2Icon,
} from "lucide-react";
import { Layout } from "./components/refine-ui/layout/layout";
// import SubjectsList from "./pages/subjects/list";
// import CreateSubject from "./pages/subjects/create";
import ListClasses from "./pages/classes/list";
import ShowClass from "./pages/classes/show";
import CreateClass from "./pages/classes/create";
import EditClass from "./pages/classes/edit";
// import SubjectsShow from "./pages/subjects/show";
import Login from "./pages/login";
import Register from "./pages/register";
// import DepartmentsCreate from "./pages/departments/create";
// import DepartmentsList from "./pages/departments/list";
// import DepartmentsShow from "./pages/departments/show";
// import FacultyList from "./pages/faculty/list";
// import FacultyShow from "./pages/faculty/show";
// import EnrollmentsCreate from "./pages/enrollments/create";
// import EnrollmentsJoin from "./pages/enrollments/join";
// import EnrollmentConfirm from "./pages/enrollments/confirm";
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
import CreateUser from "./pages/users/create";
import EditUser from "./pages/users/edit";
import ShowUser from "./pages/users/show";
import ListUsers from "./pages/users/list";
// import UpdateSubject from "./pages/subjects/edit";

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
                    <Route path="show/:id" element={<ShowClass />} />
                    <Route path="edit/:id" element={<EditClass />} />
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
                    <Route path="show/:id" element={<ShowStaff />} />
                    <Route path="edit/:id" element={<EditStaff />} />
                  </Route>

                  <Route path="users">
                    <Route index element={<ListUsers />} />
                    <Route path="create" element={<CreateUser />} />
                    <Route path="show/:id" element={<ShowUser />} />
                    <Route path="edit/:id" element={<EditUser />} />
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
