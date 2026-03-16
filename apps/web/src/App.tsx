import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CanalDetailPage from './pages/CanalDetailPage';
import PublicBoardPage from './pages/PublicBoardPage';
import SettingsPage from './pages/SettingsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import LandingPage from './pages/LandingPage';
import SandboxPage from './pages/SandboxPage';
import BillingPage from './pages/BillingPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';

// Exibe a landing page para visitantes; redireciona usuários autenticados para o dashboard
function RootRoute() {
  const token = useAuthStore((s) => s.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function App() {
  const apply = useThemeStore((s) => s.apply);

  // Aplica o tema salvo ao carregar
  useEffect(() => {
    apply();
  }, [apply]);

  return (
    <>
    <Analytics />
    <SpeedInsights />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/b/:slug" element={<PublicBoardPage />} />
      <Route path="/sandbox" element={<SandboxPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path=":canalId" element={<CanalDetailPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="/" element={<RootRoute />} />
    </Routes>
    </>
  );
}

export default App;
