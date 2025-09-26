import { Navigate, Route, Routes } from "react-router-dom";
import ExhibitionPage from "./pages/ExManagePage";
import ExManageDetail from "./pages/ExManageDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/exhibitions" replace />} />  {/*ให้ exhibition เป็นหน้าแรกชั่วคราว */}
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
    </Routes>
  );
}

export default App;
