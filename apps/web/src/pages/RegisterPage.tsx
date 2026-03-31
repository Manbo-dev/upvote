import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { googleLogin, register } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: storeLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCredential = async (idToken: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await googleLogin(idToken);
      storeLogin(response.token, {
        name: response.name,
        email: response.email,
        plano: response.plano,
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || t('auth.google.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(name, email, password);
      storeLogin(response.token, {
        name: response.name,
        email: response.email,
        plano: response.plano,
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-warm-50 to-warm-100 px-4 dark:from-warm-950 dark:to-warm-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary-600">Upvote</h1>
          <p className="mt-2 text-muted-foreground">{t('auth.register.subtitle')}</p>
        </div>

        <div className="rounded-xl bg-card p-8 shadow-lg border border-border">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            {t('auth.register.title')}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1 block">
                {t('auth.register.name')}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10"
                placeholder={t('auth.register.namePlaceholder')}
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-1 block">
                {t('auth.register.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-1 block">
                {t('auth.register.password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-10"
                placeholder={t('auth.register.passwordPlaceholder')}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t('auth.register.submitting') : t('auth.register.submit')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('auth.google.or')}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.register.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.register.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
