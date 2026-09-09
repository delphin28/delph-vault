import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/login/Login";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import SettingsPage from "../features/settings/pages/SettingsPage";
import PasswordListPage from "../features/vault/pages/PasswordListPage";


function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');

  return token ? children : <Navigate to="/" replace />;
}

function AppRoutes({}) {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginPage /> }
        />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/passwords" element={<PasswordListPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;