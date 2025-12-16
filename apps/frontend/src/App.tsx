import { Navigate, Route, Routes } from "react-router-dom";

import UnitManageDetail from "./pages/Units/UnitManageDetail";
import ExManageDetail from "./pages/Exhibitions/ExManageDetail";
import ExhibitionPage from "./pages/Exhibitions/ExManagePage";
import HomePage from "./pages/Homepage/HomePage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import TicketPage from "./pages/Ticket/TicketPage";

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

      {/* Unit management within exhibitions */}
      <Route
        path="/exhibitions/:exhibitionId/unit/new"
        element={<UnitManageDetail mode="create" />}
      />
      <Route
        path="/exhibitions/:exhibitionId/unit/:unitId"
        element={<UnitManageDetail mode="view" />}
      />
      <Route
        path="/exhibitions/:exhibitionId/unit/:unitId/edit"
        element={<UnitManageDetail mode="edit" />}
      />
      <Route path="/exhibitions/:id/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ticket" element={<TicketPage />} />
      {/* กันหลงทาง */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
