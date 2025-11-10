import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import CategoriesPage from "./pages/CategoriesPage";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import PromptFormPage from "./pages/PromptFormPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/app/library" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/app/library" replace /> : <RegisterPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<Navigate to="library" replace />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="prompts">
            <Route path="new" element={<PromptFormPage mode="create" />} />
            <Route path=":promptId" element={<PromptFormPage mode="edit" />} />
          </Route>
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/app/library" : "/login"} replace />} />
    </Routes>
  );
};

export default App;
