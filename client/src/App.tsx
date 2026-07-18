import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { CourseFormPage } from "./pages/CourseFormPage";
import { CourseRosterPage } from "./pages/CourseRosterPage";
import { MyEnrollmentsPage } from "./pages/MyEnrollmentsPage";
import { MyCoursesPage } from "./pages/MyCoursesPage";
import { MyPaymentsPage } from "./pages/MyPaymentsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminPaymentsPage } from "./pages/AdminPaymentsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CoursesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />

        <Route
          path="courses/:id/edit"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              <CourseFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/:id/roster"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              <CourseRosterPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="my-enrollments"
          element={
            <ProtectedRoute roles={["student"]}>
              <MyEnrollmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-payments"
          element={
            <ProtectedRoute roles={["student"]}>
              <MyPaymentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="my-courses"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              <MyCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-courses/new"
          element={
            <ProtectedRoute roles={["instructor", "admin"]}>
              <CourseFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/payments"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPaymentsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
