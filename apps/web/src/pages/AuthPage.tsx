import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { login, register, googleLogin, appleLogin } from '../services/auth';
import type { AuthResponse } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import AuthPanel from '../components/AuthPanel';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AppleSignInButton from '../components/AppleSignInButton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// ─── Social section (Google + Apple) ─────────────────────────────────────────

interface SocialSectionProps {
  mode: 'signin' | 'signup';
  onError: (msg: string) => void;
}

function SocialSection({ mode, onError }: SocialSectionProps) {
  const { t } = useTranslation();
  const { login: storeLogin } = useAuth();
  const navigate = useNavigate();

  const handleAuthResponse = (response: AuthResponse) => {
    storeLogin(response.token, { name: response.name, email: response.email, plano: response.plano });
    navigate('/dashboard');
  };

  const handleGoogleCredential = async (idToken: string) => {
    try {
      const response = await googleLogin(idToken);
      handleAuthResponse(response);
    } catch {
      onError(t('auth.google.errorDefault'));
    }
  };

  const handleAppleCredential = async (idToken: string, name?: string) => {
    try {
      const response = await appleLogin(idToken, name);
      handleAuthResponse(response);
    } catch {
      onError(t('auth.apple.errorDefault'));
    }
  };

  const googleText = mode === 'signin' ? 'signin_with' : 'signup_with';

  return (
    <div className="mt-6">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-3 flex-shrink text-xs text-muted-foreground">{t('auth.google.or')}</span>
        <div className="flex-grow border-t border-border" />
      </div>
      <div className="mt-4 space-y-3">
        <GoogleSignInButton onCredential={handleGoogleCredential} text={googleText} />
        <AppleSignInButton onCredential={handleAppleCredential} />
      </div>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ showLogo = false }: { showLogo?: boolean }) {
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
      storeLogin(response.token, { name: response.name, email: response.email, plano: response.plano });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.login.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {showLogo && <div className="mb-8"><span className="text-2xl font-bold text-primary-600">Upvote</span></div>}

      <h1 className="text-3xl font-bold text-foreground">{t('auth.login.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>

      {error && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">{t('auth.login.email')}</Label>
          <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t('auth.login.password')}</Label>
            <button type="button" className="text-xs text-primary-600 hover:text-primary-500 font-medium">
              {t('auth.login.forgotPassword')}
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
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

      <SocialSection mode="signin" onError={setError} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
          {t('auth.login.createAccount')}
        </Link>
      </p>
    </div>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ showLogo = false }: { showLogo?: boolean }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await register(name, email, password);
      storeLogin(response.token, { name: response.name, email: response.email, plano: response.plano });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.register.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {showLogo && <div className="mb-8"><span className="text-2xl font-bold text-primary-600">Upvote</span></div>}

      <h1 className="text-3xl font-bold text-foreground">{t('auth.register.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>

      {error && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="register-name">{t('auth.register.name')}</Label>
          <Input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('auth.register.namePlaceholder')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-email">{t('auth.register.email')}</Label>
          <Input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-password">{t('auth.register.password')}</Label>
          <Input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder={t('auth.register.passwordPlaceholder')} />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>

      <SocialSection mode="signup" onError={setError} />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  // Desktop: drives panel position (changes instantly → CSS transition does the animation)
  const [mode, setMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');

  // Mobile: separate fade state
  const [mobileMode, setMobileMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  const [mobileVisible, setMobileVisible] = useState(true);

  useEffect(() => {
    const target = isRegister ? 'register' : 'login';

    // Desktop: instant mode switch — the panel CSS `left` transition handles the animation
    setMode(target);

    // Mobile: fade out → swap → fade in
    if (target === mobileMode) return;
    setMobileVisible(false);
    const t = setTimeout(() => {
      setMobileMode(target);
      setMobileVisible(true);
    }, 180);
    return () => clearTimeout(t);
  }, [isRegister]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-4 w-full max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
      <div
        className="w-full max-w-5xl rounded-2xl shadow-lg border border-border bg-card overflow-hidden"
        style={{ minHeight: 600 }}
      >
        {/* ── Desktop: sliding panel layout ─────────────────────────────────── */}
        {/*
          Both forms are always in the DOM in their fixed slots.
          The green panel slides on top (z-10), covering whichever form is inactive.
          pointer-events prevents interaction with the form behind the panel.

          Login  → panel RIGHT: [LoginForm 54%][Panel 46%]
          Register → panel LEFT: [Panel 46%][RegisterForm 54%]
        */}
        <div className="relative hidden lg:block" style={{ minHeight: 600 }}>

          {/* Left slot: login form (always here) */}
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center px-10 xl:px-14 bg-card"
            style={{
              width: '52%',
              zIndex: mode === 'login' ? 2 : 1,
              pointerEvents: mode === 'login' ? 'auto' : 'none',
            }}
          >
            <LoginForm />
          </div>

          {/* Right slot: register form (always here) */}
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center px-10 xl:px-14 bg-card"
            style={{
              width: '52%',
              zIndex: mode === 'register' ? 2 : 1,
              pointerEvents: mode === 'register' ? 'auto' : 'none',
            }}
          >
            <RegisterForm />
          </div>

          {/* Sliding green panel — slides left↔right like a curtain */}
          <div
            className="absolute top-3 bottom-3 rounded-xl overflow-hidden z-10"
            style={{
              width: 'calc(48% - 1.5rem)',
              // Login: panel on right; Register: panel on left
              left: mode === 'login' ? 'calc(52% + 0.75rem)' : '0.75rem',
              transition: 'left 0.6s cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          >
            <AuthPanel />
          </div>
        </div>

        {/* ── Mobile: single form with fade transition ───────────────────────── */}
        <div
          className="flex lg:hidden items-center justify-center px-8 py-12"
          style={{
            minHeight: 600,
            opacity: mobileVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {mobileMode === 'login'
            ? <LoginForm showLogo />
            : <RegisterForm showLogo />
          }
        </div>
      </div>
    </div>
  );
}
