import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Camera, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { getCanais, CanalResponse } from '../services/canais';
import { updateProfile, requestPasswordChange, confirmPasswordChange } from '../services/users';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

// ─── Resize image to max 256×256 and return base64 JPEG ──────────────────────

async function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 256;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height / width) * MAX);
          width = MAX;
        } else {
          width = Math.round((width / height) * MAX);
          height = MAX;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ─── Password Change Dialog ───────────────────────────────────────────────────

interface PasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
}

function PasswordChangeDialog({ open, onClose, onSuccess, userEmail }: PasswordDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetDialog = () => {
    setStep('form');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCode('');
    setError('');
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      await requestPasswordChange(currentPassword, newPassword);
      setStep('code');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || t('settings.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmPasswordChange(code);
      resetDialog();
      onSuccess();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message || t('settings.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.changePassword')}</DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? t('settings.changePasswordDesc')
              : t('settings.codeSent', { email: userEmail })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('settings.currentPassword')}</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.newPassword')}</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.confirmPassword')}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('common.loading') : t('settings.sendCode')}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('settings.codeLabel')}</Label>
              <Input
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
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('form');
                  setError('');
                }}
              >
                {t('common.back')}
              </Button>
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? t('common.loading') : t('settings.confirmChange')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { updateUser } = useAuthStore();
  const { data: canais } = useQuery({ queryKey: ['canais'], queryFn: getCanais });
  const firstCanal = canais?.[0];

  // Profile state
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password dialog state
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const base64 = await resizeImageToBase64(file);
        setAvatarPreview(base64);
        setSavingProfile(true);
        setProfileMsg(null);
        const result = await updateProfile({ avatar: base64 });
        updateUser({ avatar: result.avatar });
        setProfileMsg({ type: 'success', text: t('settings.avatarUpdated') });
      } catch {
        setProfileMsg({ type: 'error', text: t('settings.errorDefault') });
      } finally {
        setSavingProfile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [updateUser, t],
  );

  const handleSaveName = async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === user?.name) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const result = await updateProfile({ name: trimmed });
      updateUser({ name: result.name });
      setProfileMsg({ type: 'success', text: t('settings.nameUpdated') });
    } catch {
      setProfileMsg({ type: 'error', text: t('settings.errorDefault') });
    } finally {
      setSavingProfile(false);
    }
  };

  const nameChanged = nameValue.trim() !== (user?.name || '');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t('settings.title')}</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 text-lg font-semibold text-foreground">{t('settings.profile')}</h2>

          {/* Avatar */}
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={savingProfile}
                className="group relative h-20 w-20 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={t('settings.avatar.change')}
              >
                <Avatar className="h-20 w-20">
                  {avatarPreview && (
                    <AvatarImage src={avatarPreview} alt={user?.name} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary-100 text-2xl font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('settings.avatar.change')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('settings.avatar.hint')}</p>
            </div>
          </div>

          {/* Profile feedback message */}
          {profileMsg && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
                profileMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              )}
              {profileMsg.text}
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label className="mb-1.5 block">{t('settings.name')}</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="flex-1"
                />
                <Button onClick={handleSaveName} disabled={!nameChanged || savingProfile} size="sm">
                  {savingProfile ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </div>

            {/* Email — read only */}
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Label>{t('settings.email')}</Label>
                <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-500 dark:bg-warm-800 dark:text-warm-400">
                  {t('settings.emailReadOnly')}
                </span>
              </div>
              <Input
                type="email"
                value={user?.email || ''}
                readOnly
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 text-lg font-semibold text-foreground">{t('settings.security')}</h2>
          <p className="mb-5 text-sm text-muted-foreground">{t('settings.securityDesc')}</p>

          {pwSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {t('settings.passwordChanged')}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{t('settings.passwordLabel')}</p>
                <p className="text-xs text-muted-foreground">••••••••</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPwSuccess(false);
                setPwDialogOpen(true);
              }}
            >
              {t('settings.changePassword')}
            </Button>
          </div>
        </div>

        {/* Widget installation guide */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('settings.widgetSection')}</h2>
            <Link
              to="/dashboard/api-keys"
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {t('settings.widget.viewApiKeys')} →
            </Link>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">{t('settings.widgetDescription')}</p>

          <div className="mb-6 space-y-4">
            <Step
              title={t('settings.widget.step1Title')}
              description={t('settings.widget.step1Description')}
            />
            {firstCanal ? (
              <SnippetBlock canal={firstCanal} />
            ) : (
              <p className="rounded-lg border border-dashed border-warm-300 p-4 text-sm text-muted-foreground dark:border-warm-700">
                {t('settings.widget.noCanal')}{' '}
                <Link
                  to="/dashboard"
                  className="text-primary-600 hover:underline dark:text-primary-400"
                >
                  {t('nav.channels')}
                </Link>
              </p>
            )}
            <Step
              title={t('settings.widget.step2Title')}
              description={t('settings.widget.step2Description')}
            />
            <Step
              title={t('settings.widget.step3Title')}
              description={t('settings.widget.step3Description')}
              highlight
            />
          </div>

          <div className="mb-6 rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
              {t('settings.widget.contextTitle')}
            </p>
            <ul className="space-y-1">
              {(['contextUrl', 'contextInteraction', 'contextDevice'] as const).map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                  {t(`settings.widget.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <AdvancedOptions />
        </div>
      </div>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={pwDialogOpen}
        onClose={() => setPwDialogOpen(false)}
        onSuccess={() => {
          setPwDialogOpen(false);
          setPwSuccess(true);
        }}
        userEmail={user?.email || ''}
      />
    </div>
  );
}

// ─── Sub-components (widget section) ─────────────────────────────────────────

function Step({
  title,
  description,
  highlight,
}: {
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${highlight ? 'bg-green-50 dark:bg-green-900/20' : 'bg-warm-50 dark:bg-warm-800/50'}`}
    >
      <p
        className={`text-sm font-semibold ${highlight ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}
      >
        {title}
      </p>
      <p
        className={`text-sm ${highlight ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}
      >
        {description}
      </p>
    </div>
  );
}

function SnippetBlock({ canal }: { canal: CanalResponse }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const snippet = `<script
  src="https://api.upvote.pro/widget.js"
  data-api-key="${canal.apiKey}"
  data-base-url="https://api.upvote.pro"
  data-color="${canal.widgetColor}"
  data-trigger="button"
></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
        {snippet}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-600"
      >
        {copied ? t('settings.widget.copied') : t('settings.widget.copySnippet')}
      </button>
    </div>
  );
}

function AdvancedOptions() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-warm-100 pt-4 dark:border-warm-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {t('settings.widget.advancedTitle')}
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {(['advancedTriggerButton', 'advancedTriggerAlways', 'advancedProgrammatic'] as const).map(
            (key) => (
              <li
                key={key}
                className="rounded-lg bg-warm-50 px-3 py-2 font-mono text-xs text-foreground dark:bg-warm-800"
              >
                {t(`settings.widget.${key}`)}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
