import { Navigate, useLocation } from "react-router-dom";
import { isStaff, useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/EmptyState";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />;
  return children;
}

export function StaffRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!isStaff(user.role)) return <Navigate to="/" replace />;
  return children;
}
