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
  Users,
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
                    icon: <GraduationCap />,
                  },
                },
                {
                  name: "users",
                  list: "/faculty",
                  show: "/faculty/show/:id",
                  meta: {
                    label: "Faculty",
                    icon: <Users />,
                  },
                },
                // {
                //   name: "subjects",
                //   list: "/subjects",
                //   create: "/subjects/create",
                //   show: "/subjects/show/:id",
                //   edit: "/subjects/edit/:id",
                //   meta: {
                //     label: "Subjects",
                //     icon: <BookOpen />,
                //   },
                // },
                // {
                //   name: "departments",
                //   list: "/departments",
                //   show: "/departments/show/:id",
                //   edit: "/departments/edit/:id",
                //   create: "/departments/create",
                //   meta: {
                //     label: "Departments",
                //     icon: <Building2 />,
                //   },
                // },
                // {
                //   name: "enrollments",
                //   list: "/enrollments/create",
                //   create: "/enrollments/create",
                //   meta: {
                //     label: "Enrollments",
                //     icon: <ClipboardCheck />,
                //   },
                // },
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
                  {/* <Route path="subjects">
                    <Route index element={<SubjectsList />} />
                    <Route path="create" element={<CreateSubject />} />
                    <Route path="show/:id" element={<SubjectsShow />} />
                    <Route path="edit/:id" element={<UpdateSubject />} />
                  </Route> */}

                  {/* <Route path="departments">
                    <Route index element={<DepartmentsList />} />
                    <Route path="create" element={<DepartmentsCreate />} />
                    <Route path="show/:id" element={<DepartmentsShow />} />
                  </Route> */}

                  {/* <Route path="faculty">
                    <Route index element={<FacultyList />} />
                    <Route path="show/:id" element={<FacultyShow />} />
                  </Route> */}

                  {/* <Route path="enrollments">
                    <Route path="create" element={<EnrollmentsCreate />} />
                    <Route path="join" element={<EnrollmentsJoin />} />
                    <Route path="confirm" element={<EnrollmentConfirm />} />
                  </Route> */}

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
