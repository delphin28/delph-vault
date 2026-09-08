import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import SettingsPage from "../features/settings/pages/SettingsPage";
import PasswordListPage from "../features/vault/pages/PasswordListPage";


function AppRoutes({ backendStatus }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginPage backendStatus={backendStatus} />}
        />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/passwords" element={<PasswordListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;