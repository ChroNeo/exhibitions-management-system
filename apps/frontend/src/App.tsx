import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AdminGuard from "./components/AdminGuard";
import AdminDashboardPage from "./pages/AdminPanel/AdminDashboardPage";
import UserManagementPage from "./pages/AdminPanel/UserManagementPage";
import VisitorManagementPage from "./pages/AdminPanel/VisitorManagementPage";
import CertificateDownloadPage from "./pages/Certificate/Certificate-Download-Page";
import CertificatePage from "./pages/Certificate/CertificatePage";
import DashboardSelectorPage from "./pages/DashboardSelector/DashboardSelectorPage";
import ExManageDetail from "./pages/Exhibitions/ExManageDetail";
import ExhibitionPage from "./pages/Exhibitions/ExManagePage";
import HomePage from "./pages/Homepage/HomePage";
import LoginPage from "./pages/LoginPage/LoginPage";
import NewsPage from "./pages/News/NewsPage";
import OrgDashboardPage from "./pages/OrgDashboard/OrgDashboardPage";
import NewsDetailPage from "./pages/PublicNews/NewsDetailPage";
import PublicNewsPage from "./pages/PublicNews/PublicNewsPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import VerifyTicketPage from "./pages/ScanPage/VerifyTicketPage";
import CreateSurveyPage from "./pages/Survey/CreateSurveyPage";
import ExhibitionSurveyPage from "./pages/Survey/ExhibitionSurveyPage";
import SurveyListPage from "./pages/Survey/SurveyListPage";
import UnitSurveyPage from "./pages/Survey/UnitSurveyPage";
import TicketPage from "./pages/Ticket/TicketPage";
import UnitDashboardPage from "./pages/UnitDashboard/UnitDashboardPage";
import UnitManageDetail from "./pages/Units/UnitManageDetail";

function LegacySurveyListRedirect() {
  const location = useLocation();

  return <Navigate replace to={`/survey/list${location.search}`} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/news" element={<PublicNewsPage />} />
      <Route path="/news/detail/:id" element={<NewsDetailPage />} />
      <Route path="/news/:exhibitionId" element={<PublicNewsPage />} />

      <Route path="/exhibitions" element={<ExhibitionPage />} />
      <Route
        path="/exhibitions/new"
        element={<ExManageDetail mode="create" />}
      />
      <Route path="/exhibitions/:id" element={<ExManageDetail mode="view" />} />

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
      <Route path="/exhibitions/:exhibitionId/news" element={<NewsPage />} />

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
      <Route path="/verify-ticket" element={<VerifyTicketPage />} />

      <Route
        path="/survey/create/:exhibition_id"
        element={<CreateSurveyPage />}
      />
      <Route path="/survey/answer" element={<ExhibitionSurveyPage />} />
      <Route path="/survey/units" element={<UnitSurveyPage />} />
      <Route path="/survey/list" element={<SurveyListPage />} />
      <Route
        path="/survey/unit-list"
        element={<LegacySurveyListRedirect />}
      />

      <Route path="/dashboard/selector" element={<DashboardSelectorPage />} />
      <Route path="/dashboard/organizer/:id" element={<OrgDashboardPage />} />

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
      <Route path="/dashboard/staff" element={<UnitDashboardPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
