import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import CanalDetailPage from './pages/CanalDetailPage';
import SettingsPage from './pages/SettingsPage';
import ApiKeysPage from './pages/ApiKeysPage';
import LandingPage from './pages/LandingPage';
import SandboxPage from './pages/SandboxPage';
import BillingPage from './pages/BillingPage';
import ArchivePage from './pages/ArchivePage';
import IntegrationsPage from './pages/IntegrationsPage';
import IntegrationCallbackPage from './pages/IntegrationCallbackPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import PublicBoardPage from './pages/PublicBoardPage';
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
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/sandbox" element={<SandboxPage />} />
      <Route path="/integrations/:provider/callback" element={<IntegrationCallbackPage />} />
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
        <Route path=":canalId/arquivo" element={<ArchivePage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      <Route path="/b/:slug" element={<PublicBoardPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/" element={<RootRoute />} />
    </Routes>
    </>
  );
}

export default App;
