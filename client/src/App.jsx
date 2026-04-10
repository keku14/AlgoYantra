import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";

const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard.jsx"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard.jsx"));

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="glass-panel px-6 py-4 text-sm text-slate-200">
            Loading AlgoYantra...
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/teacher"
          element={(
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/student"
          element={(
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
