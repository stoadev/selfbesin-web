import { Routes, Route } from "react-router-dom";
import LandingPage from "../pages/Landing/LandingPage";
import FoodDetailPage from "../pages/Food/FoodDetailPage";
import SearchResultsPage from "../pages/Search/SearchResultsPage";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import MealsPage from "../pages/Meals/MealsPage";
import PrivacyPage from "../pages/Privacy/PrivacyPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

import PageLayout from "../components/layout/PageLayout";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PageLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/besin/:slug" element={<FoodDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />

        <Route path="/privacy" element={<PrivacyPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/meals" element={<MealsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
