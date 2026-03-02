import { Navigate, Route, Routes } from "react-router-dom";

import AdminGuard from "./components/AdminGuard";
import AdminDashboardPage from "./pages/AdminPanel/AdminDashboardPage";
import UserManagementPage from "./pages/AdminPanel/UserManagementPage";
import VisitorManagementPage from "./pages/AdminPanel/VisitorManagementPage";
import CertificateDownloadPage from "./pages/Certificate/Certificate-Download-Page";
import CertificatePage from "./pages/Certificate/CertificatePage";
import ExManageDetail from "./pages/Exhibitions/ExManageDetail";
import ExhibitionPage from "./pages/Exhibitions/ExManagePage";
import HomePage from "./pages/Homepage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import NewsPage from "./pages/News/NewsPage";
import NewsDetailPage from "./pages/PublicNews/NewsDetailPage";
import PublicNewsPage from "./pages/PublicNews/PublicNewsPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import VerifyTicketPage from "./pages/ScanPage/VerifyTicketPage";
import CreateSurveyPage from "./pages/Survey/CreateSurveyPage";
import ExhibitionSurveyPage from "./pages/Survey/ExhibitionSurveyPage";
import SurveySelectPage from "./pages/Survey/SurveySelectPage";
import UnitListPage from "./pages/Survey/UnitListPage";
import UnitSurveyPage from "./pages/Survey/UnitSurveyPage";
import TicketPage from "./pages/Ticket/TicketPage";
import OrgDashboardPage from "./pages/OrgDashboard/OrgDashboardPage";
import UnitManageDetail from "./pages/Units/UnitManageDetail";
import UnitDashboardPage from "./pages/UnitDashboard/UnitDashboardPage";

export default function App() {
  return (
    <Routes>
      {/* หน้าแรก = Home */}
      <Route path="/" element={<HomePage />} />

      {/* ข่าวสารสำหรับผู้ใช้ทั่วไป */}
      <Route path="/news" element={<PublicNewsPage />} />
      <Route path="/news/detail/:id" element={<NewsDetailPage />} />
      <Route path="/news/:exhibitionId" element={<PublicNewsPage />} />

      {/* Exhibitions */}
      <Route path="/exhibitions" element={<ExhibitionPage />} />
      <Route
        path="/exhibitions/new"
        element={<ExManageDetail mode="create" />}
      />
      <Route path="/exhibitions/:id" element={<ExManageDetail mode="view" />} />

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
      {/*Announcement Page*/}
      <Route path="/exhibitions/:exhibitionId/news" element={<NewsPage />} />

      {/* Certificate management */}
      <Route
        path="/exhibitions/:exhibitionId/certificate"
        element={<CertificatePage />}
      />
      <Route
        path="/certificate/download"
        element={<CertificateDownloadPage />}
      />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/ticket" element={<TicketPage />} />
      <Route path="/scan" element={<VerifyTicketPage />} />

      {/* Survey Routes */}
      <Route path="/survey/exhibitions" element={<SurveySelectPage />} />
      <Route
        path="/survey/create/:exhibition_id"
        element={<CreateSurveyPage />}
      />
      <Route path="/survey/answer" element={<ExhibitionSurveyPage />} />
      <Route path="/survey/units" element={<UnitSurveyPage />} />
      <Route path="/survey/unit-list" element={<UnitListPage />} />

      {/* Organizer Dashboard */}
      <Route path="/dashboard/organizer/:id" element={<OrgDashboardPage />} />

      {/* Admin Panel */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminDashboardPage />
          </AdminGuard>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminGuard>
            <UserManagementPage />
          </AdminGuard>
        }
      />

      <Route
        path="/admin/visitors"
        element={
          <AdminGuard>
            <VisitorManagementPage />
          </AdminGuard>
        }
      />
      <Route path="/dashboard/staff/:ex_id/:id" element={<UnitDashboardPage />} />

      {/* กันหลงทาง */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
