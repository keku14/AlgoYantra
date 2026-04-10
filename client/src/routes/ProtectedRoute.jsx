import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="glass-panel flex items-center gap-3 px-6 py-4 text-sm text-slate-200">
        <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
        Preparing AlgoYantra workspace...
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

  return children;
}
