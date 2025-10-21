import { Navigate, Route, Routes } from "react-router-dom";

import UnitManagePage from "./pages/Units/UnitManagePage";
import UnitManageList from "./pages/Units/UnitManageList";
import UnitManageDetail from "./pages/Units/UnitManageDetail";
import ExManageDetail from "./pages/Exhibitions/ExManageDetail";
import ExhibitionPage from "./pages/Exhibitions/ExManagePage";
import HomePage from "./pages/Homepage/HomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";

export default function App() {
  return (
    <Routes>
      {/* หน้าแรก = Home */}
      <Route path="/" element={<HomePage />} />

      {/* Exhibitions */}
      <Route path="/exhibitions" element={<ExhibitionPage />} />
      <Route
        path="/exhibitions/new"
        element={<ExManageDetail mode="create" />}
      />
      <Route path="/exhibitions/:id" element={<ExManageDetail mode="view" />} />
      <Route
        path="/exhibitions/:id/edit"
        element={<ExManageDetail mode="edit" />}
      />

      {/* Units */}
      <Route path="/units" element={<UnitManagePage />} />
      <Route path="/units/:id" element={<UnitManageList mode="view" />} />
      <Route
        path="/units/:exhibitionId/unit/new"
        element={<UnitManageDetail mode="create" />}
      />
      <Route
        path="/units/:exhibitionId/unit/:unitId"
        element={<UnitManageDetail mode="view" />}
      />
      <Route
        path="/units/:exhibitionId/unit/:unitId/edit"
        element={<UnitManageDetail mode="edit" />}
      />
      <Route path="/exhibitions/:id/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* กันหลงทาง */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
