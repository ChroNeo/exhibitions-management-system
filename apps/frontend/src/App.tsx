import { Navigate, Route, Routes } from "react-router-dom";

import UnitManagePage from "./pages/Units/UnitManagePage";
import UnitManageList from "./pages/Units/UnitManageList";
import ExManageDetail from "./pages/Exhibitions/ExManageDetail";
import ExhibitionPage from "./pages/Exhibitions/ExManagePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/exhibitions" replace />} />{" "}
      {/*ให้ exhibition เป็นหน้าแรกชั่วคราว */}
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
      <Route path="/units" element={<UnitManagePage />} />
      <Route path="/units/new" element={<UnitManageList mode="create" />} />
      <Route path="/units/:id" element={<UnitManageList mode="view" />} />
      <Route path="/units/:id/edit" element={<UnitManageList mode="edit" />} />
    </Routes>
  );
}

export default App;
