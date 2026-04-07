import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { login, register, googleLogin, forgotPassword, resetPassword } from '../services/auth';
import type { AuthResponse } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import AuthPanel from '../components/AuthPanel';
import GoogleSignInButton from '../components/GoogleSignInButton';
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
    storeLogin(response.token, {
      name: response.name,
      email: response.email,
      plano: response.plano,
      avatar: response.avatar,
      memberRole: response.memberRole,
      workspaceName: response.workspaceName,
    });
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

  const googleText = mode === 'signin' ? 'signin_with' : 'signup_with';

  return (
    <div className="mt-6">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-border" />
        <span className="mx-3 flex-shrink text-xs text-muted-foreground">{t('auth.google.or')}</span>
        <div className="flex-grow border-t border-border" />
      </div>
      <div className="mt-4">
        <GoogleSignInButton onCredential={handleGoogleCredential} text={googleText} />
      </div>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

interface LoginFormProps {
  showLogo?: boolean;
  onForgotPassword: () => void;
}

function LoginForm({ showLogo = false, onForgotPassword }: LoginFormProps) {
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
        avatar: response.avatar,
        memberRole: response.memberRole,
        workspaceName: response.workspaceName,
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
    <div className="w-full max-w-sm">
      {showLogo && (
        <div className="mb-8">
          <span className="text-2xl font-bold text-primary-600">Upvote</span>
        </div>
      )}

      <h1 className="text-3xl font-bold text-foreground">{t('auth.login.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">{t('auth.login.email')}</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t('auth.login.password')}</Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-primary-600 hover:text-primary-500"
            >
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
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? undefined;
  const prefillEmail = searchParams.get('email') ?? '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
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
      const response = await register(name, email, password, inviteToken);
      storeLogin(response.token, {
        name: response.name,
        email: response.email,
        plano: response.plano,
        avatar: response.avatar,
        memberRole: response.memberRole,
        workspaceName: response.workspaceName,
      });
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
      {showLogo && (
        <div className="mb-8">
          <span className="text-2xl font-bold text-primary-600">Upvote</span>
        </div>
      )}

      <h1 className="text-3xl font-bold text-foreground">{t('auth.register.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="register-name">{t('auth.register.name')}</Label>
          <Input
            id="register-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t('auth.register.namePlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-email">{t('auth.register.email')}</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            readOnly={!!prefillEmail}
            className={prefillEmail ? 'bg-warm-50 text-muted-foreground dark:bg-warm-800' : ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="register-password">{t('auth.register.password')}</Label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={t('auth.register.passwordPlaceholder')}
          />
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

// ─── Forgot Password form ─────────────────────────────────────────────────────

interface ForgotPasswordFormProps {
  showLogo?: boolean;
  onBackToLogin: () => void;
}

function ForgotPasswordForm({ showLogo = false, onBackToLogin }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'email' | 'code' | 'new-password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // Always proceed to avoid revealing whether email exists
    } finally {
      setLoading(false);
      setStep('code');
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError(t('auth.forgot.codeError'));
      return;
    }
    setError('');
    setStep('new-password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('auth.forgot.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      onBackToLogin();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || t('auth.forgot.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {showLogo && (
        <div className="mb-8">
          <span className="text-2xl font-bold text-primary-600">Upvote</span>
        </div>
      )}

      {/* Step: email */}
      {step === 'email' && (
        <>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.forgot.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.forgot.emailSubtitle')}</p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSendCode} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email">{t('auth.forgot.emailLabel')}</Label>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                autoFocus
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.forgot.sending') : t('auth.forgot.sendCode')}
            </Button>
          </form>
        </>
      )}

      {/* Step: code */}
      {step === 'code' && (
        <>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.forgot.codeTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.forgot.codeSent', { email })}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyCode} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-code">{t('auth.forgot.codeLabel')}</Label>
              <Input
                id="forgot-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
            </div>
            <Button type="submit" disabled={code.length !== 6} className="w-full">
              {t('auth.forgot.verify')}
            </Button>
          </form>
        </>
      )}

      {/* Step: new-password */}
      {step === 'new-password' && (
        <>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.forgot.newPasswordTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.forgot.newPasswordSubtitle')}</p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t('auth.forgot.newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t('auth.forgot.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.forgot.resetting') : t('auth.forgot.reset')}
            </Button>
          </form>
        </>
      )}

      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-8 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.forgot.backToLogin')}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  // Desktop mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(
    isRegister ? 'register' : 'login',
  );

  // Mobile: separate fade state
  const [mobileMode, setMobileMode] = useState<'login' | 'register' | 'forgot'>(
    isRegister ? 'register' : 'login',
  );
  const [mobileVisible, setMobileVisible] = useState(true);

  useEffect(() => {
    const target = isRegister ? 'register' : 'login';

    // Desktop: instant mode switch
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

  const handleForgot = () => {
    setMode('forgot');
    setMobileVisible(false);
    setTimeout(() => {
      setMobileMode('forgot');
      setMobileVisible(true);
    }, 180);
  };

  const handleBackToLogin = () => {
    setMode('login');
    setMobileVisible(false);
    setTimeout(() => {
      setMobileMode('login');
      setMobileVisible(true);
    }, 180);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-4 w-full max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>
      </div>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        style={{ minHeight: 600 }}
      >
        {/* ── Desktop: sliding panel layout ─────────────────────────────────── */}
        <div className="relative hidden lg:block" style={{ minHeight: 600 }}>

          {/* Left slot: login or forgot form */}
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center bg-card px-10 xl:px-14"
            style={{
              width: '52%',
              zIndex: mode === 'login' || mode === 'forgot' ? 2 : 1,
              pointerEvents: mode === 'login' || mode === 'forgot' ? 'auto' : 'none',
            }}
          >
            {mode === 'forgot' ? (
              <ForgotPasswordForm onBackToLogin={handleBackToLogin} />
            ) : (
              <LoginForm onForgotPassword={handleForgot} />
            )}
          </div>

          {/* Right slot: register form */}
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center bg-card px-10 xl:px-14"
            style={{
              width: '52%',
              zIndex: mode === 'register' ? 2 : 1,
              pointerEvents: mode === 'register' ? 'auto' : 'none',
            }}
          >
            <RegisterForm />
          </div>

          {/* Sliding green panel */}
          <div
            className="absolute bottom-3 top-3 z-10 overflow-hidden rounded-xl"
            style={{
              width: 'calc(48% - 1.5rem)',
              left:
                mode === 'register' ? '0.75rem' : 'calc(52% + 0.75rem)',
              transition: 'left 0.6s cubic-bezier(0.65, 0, 0.35, 1)',
            }}
          >
            <AuthPanel />
          </div>
        </div>

        {/* ── Mobile: single form with fade transition ───────────────────────── */}
        <div
          className="flex items-center justify-center px-8 py-12 lg:hidden"
          style={{
            minHeight: 600,
            opacity: mobileVisible ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          {mobileMode === 'login' && (
            <LoginForm showLogo onForgotPassword={handleForgot} />
          )}
          {mobileMode === 'register' && <RegisterForm showLogo />}
          {mobileMode === 'forgot' && (
            <ForgotPasswordForm showLogo onBackToLogin={handleBackToLogin} />
          )}
        </div>
      </div>
    </div>
  );
}
