import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loading from "../common/Loading";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kullanıcı giriş yapmışsa child route'ları render et
  return <Outlet />;
}
