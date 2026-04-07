import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getInvitePreview, acceptInvite, type InvitePreviewResponse } from '../services/team';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../hooks/useAuth';

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function InviteAcceptPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const { login: storeLogin } = useAuth();

  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getInvitePreview(token)
      .then(setPreview)
      .catch(() => setError(t('invite.invalid')))
      .finally(() => setLoading(false));
  }, [token, t]);

  // If logged in and invite is valid, auto-accept
  useEffect(() => {
    if (!token || !preview || !isAuthenticated) return;
    if (preview.expired || preview.alreadyAccepted) return;

    setAccepting(true);
    acceptInvite(token)
      .then((authResponse) => {
        // Refresh auth store so the workspace switcher and sidebar reflect new membership
        storeLogin(authResponse.token, {
          name: authResponse.name,
          email: authResponse.email,
          plano: authResponse.plano,
          ownPlano: authResponse.ownPlano,
          avatar: authResponse.avatar,
          memberRole: authResponse.memberRole,
          workspaceName: authResponse.workspaceName,
        });
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        setAccepting(false);
        setError(err?.response?.data?.message || t('common.error'));
      });
  }, [token, preview, isAuthenticated, navigate, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full rounded-xl border border-warm-200 bg-card p-8 text-center shadow-sm dark:border-warm-700">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('invite.invalid')}</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link to="/login">
            <Button variant="outline" className="w-full">{t('invite.signIn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (preview?.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full rounded-xl border border-warm-200 bg-card p-8 text-center shadow-sm dark:border-warm-700">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('invite.expired')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('invite.expiredDescription')}
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">{t('invite.signIn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (preview?.alreadyAccepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm w-full rounded-xl border border-warm-200 bg-card p-8 text-center shadow-sm dark:border-warm-700">
          <UserCheck className="mx-auto h-10 w-10 text-green-500 mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">{t('invite.alreadyAccepted')}</h2>
          <div className="mt-4">
            <Link to="/login">
              <Button className="w-full">{t('invite.signIn')}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated + valid — show accepting spinner
  if (isAuthenticated && accepting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-muted-foreground">{t('invite.accepting')}</p>
        </div>
      </div>
    );
  }

  // Not authenticated — show invite card with options
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-warm-50 to-primary-50 dark:from-warm-950 dark:to-warm-900 px-4">
      <div className="max-w-sm w-full rounded-xl border border-warm-200 bg-card p-8 text-center shadow-sm dark:border-warm-700">
        {/* Upvote branding */}
        <p className="text-xl font-bold text-primary-600 mb-6">Upvote</p>

        {/* Owner avatar */}
        <Avatar className="mx-auto h-16 w-16 border-2 border-primary-100 dark:border-primary-900 mb-4">
          {preview?.ownerAvatar && (
            <AvatarImage src={preview.ownerAvatar} alt={preview.ownerName ?? ''} />
          )}
          <AvatarFallback className="bg-primary-100 text-xl font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            {getInitials(preview?.ownerName)}
          </AvatarFallback>
        </Avatar>

        <h2 className="text-lg font-semibold text-foreground">
          {t('invite.title')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('invite.description', { ownerName: preview?.ownerName ?? '...' })}
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to={`/register?inviteToken=${token}&email=${encodeURIComponent(preview?.invitedEmail ?? '')}`}
          >
            <Button className="w-full">{t('invite.createAccount')}</Button>
          </Link>
          <Link to={`/login?redirect=/invite/${token}`}>
            <Button variant="outline" className="w-full">{t('invite.signIn')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
