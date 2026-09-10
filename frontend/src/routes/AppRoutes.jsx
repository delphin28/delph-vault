import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/login/Login";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import SettingsPage from "../features/settings/pages/SettingsPage";
import PasswordListPage from "../features/vault/pages/PasswordListPage";
import ForgotPasswordPage from "../features/forgot-password/ForgotPasswordPage";
import { getCurrentUser } from "../api/authApi";


function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginPage /> }
        />
        <Route
          path ="/forgot-password"  
          element = {<ForgotPasswordPage />}
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