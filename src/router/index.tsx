import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/Landing/LandingPage";
import FoodDetailPage from "../pages/Food/FoodDetailPage";
import ProtectedRoute from "../components/layout/ProtectedRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/besin/:slug" element={<FoodDetailPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}></Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
