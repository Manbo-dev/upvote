import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import AuthPanel from '../components/AuthPanel';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// ─── Social button icons (placeholders — no integration yet) ──────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      storeLogin(response.token, {
        name: response.name,
        email: response.email,
        plano: response.plano,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.login.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-5xl rounded-2xl shadow-lg border border-border overflow-hidden flex bg-card min-h-[600px]">
      {/* ── Left: form ── */}
      <div className="flex flex-1 items-center justify-center px-8 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          {/* Logo — visible on mobile only (panel is hidden) */}
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-bold text-primary-600">Upvote</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.login.subtitle')}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <button
                  type="button"
                  className="text-xs text-primary-600 hover:text-primary-500 font-medium"
                >
                  {t('auth.login.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>
          </form>

          {/* Social login divider */}
          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-border" />
              <span className="mx-3 flex-shrink text-xs text-muted-foreground">
                {t('auth.google.or')}
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* Social buttons */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {/* Google — placeholder, OAuth to be re-wired */}
              <button
                type="button"
                className="flex items-center justify-center rounded-lg border border-border bg-card py-2.5 hover:bg-accent transition-colors"
                aria-label="Google"
              >
                <GoogleIcon />
              </button>

              {/* Apple — placeholder */}
              <button
                type="button"
                className="flex items-center justify-center rounded-lg border border-border bg-card py-2.5 hover:bg-accent transition-colors"
                aria-label="Apple"
              >
                <AppleIcon />
              </button>

              {/* Facebook — placeholder */}
              <button
                type="button"
                className="flex items-center justify-center rounded-lg border border-border bg-card py-2.5 hover:bg-accent transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('auth.login.noAccount')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right: brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] m-3 rounded-xl overflow-hidden">
        <AuthPanel />
      </div>
      </div>
    </div>
  );
}
