import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PublicBoardPage from './pages/PublicBoardPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import SandboxPage from './pages/SandboxPage';
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
        <Route path=":productId" element={<ProductDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<RootRoute />} />
    </Routes>
    </>
  );
}

export default App;
