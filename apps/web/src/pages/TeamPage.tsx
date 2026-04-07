import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users, Trash2, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { listMembers, inviteMember, removeMember, type TeamMember } from '../services/team';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

const PLAN_LIMITS: Record<string, number> = {
  FREE: 0,
  STARTER: 3,
  PRO: 10,
  BUSINESS: Infinity,
};

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function StatusBadge({ status }: { status: TeamMember['status'] }) {
  const { t } = useTranslation();
  if (status === 'ACTIVE') {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {t('team.statuses.ACTIVE')}
      </Badge>
    );
  }
  if (status === 'PENDING') {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
        <Clock className="h-3 w-3" />
        {t('team.statuses.PENDING')}
      </Badge>
    );
  }
  return (
    <Badge className="bg-warm-100 text-warm-500 dark:bg-warm-800 dark:text-warm-400 gap-1">
      <XCircle className="h-3 w-3" />
      {t('team.statuses.REVOKED')}
    </Badge>
  );
}

function InviteMemberDialog({ onSuccess, onError }: { onSuccess: (msg: string) => void; onError: (msg: string) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: inviteMember,
    onSuccess: () => {
      const successEmail = email;
      setEmail('');
      setOpen(false);
      onSuccess(t('team.inviteSuccess', { email: successEmail }));
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      onError(error?.response?.data?.message || t('team.inviteError'));
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('team.inviteButton')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('team.inviteTitle')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(email);
          }}
          className="space-y-4 pt-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">{t('team.inviteEmailLabel')}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder={t('team.inviteEmailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t('team.inviteSending') : t('team.inviteSubmit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Members can't access this page
  if (user?.memberRole === 'MEMBER') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const plan = user?.plano ?? 'FREE';
  const limit = PLAN_LIMITS[plan] ?? 0;
  const canInvite = limit > 0;

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: listMembers,
    enabled: canInvite,
  });

  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;

  const removeMutation = useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      setBanner({ type: 'success', message: t('team.revokeSuccess') });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      setBanner({ type: 'error', message: error?.response?.data?.message || t('common.error') });
    },
  });

  const visibleMembers = members.filter((m) => m.status !== 'REVOKED');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">{t('team.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('team.description')}</p>
        </div>
        {canInvite && (
          <InviteMemberDialog
            onSuccess={(msg) => {
              setBanner({ type: 'success', message: msg });
              queryClient.invalidateQueries({ queryKey: ['team-members'] });
            }}
            onError={(msg) => setBanner({ type: 'error', message: msg })}
          />
        )}
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            banner.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {banner.message}
        </div>
      )}

      {/* No access on FREE plan */}
      {!canInvite && (
        <div className="rounded-xl border border-warm-200 bg-warm-50 p-8 text-center dark:border-warm-700 dark:bg-warm-900/50">
          <Lock className="mx-auto h-10 w-10 text-warm-400 dark:text-warm-500 mb-3" />
          <p className="font-medium text-foreground">{t('team.limit.reached')}</p>
          <p className="mt-1 text-sm text-muted-foreground mb-4">
            {t('team.limitFreePlan')}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/billing')}>
            {t('team.limit.upgradeLink')}
          </Button>
        </div>
      )}

      {/* Usage indicator */}
      {canInvite && (
        <div className="rounded-lg border border-warm-200 bg-warm-50 px-4 py-3 dark:border-warm-700 dark:bg-warm-900/50">
          <p className="text-sm text-muted-foreground">
            {limit === Infinity
              ? t('team.limit.unlimited', { used: activeCount })
              : t('team.limit.used', { used: activeCount, max: limit })}
            {' '}· {t('billing.plan')} <span className="font-semibold text-foreground">{plan}</span>
          </p>
        </div>
      )}

      {/* Members list */}
      {canInvite && (
        <div className="rounded-xl border border-warm-200 bg-card dark:border-warm-700">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
          ) : visibleMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <Users className="h-8 w-8 text-warm-300 dark:text-warm-600" />
              <p className="font-medium text-foreground">{t('team.noMembers')}</p>
              <p className="text-sm text-muted-foreground">{t('team.noMembersDescription')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-warm-100 dark:divide-warm-800">
              {visibleMembers.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar className="h-9 w-9 border border-warm-200 dark:border-warm-700">
                    {member.memberAvatar && (
                      <AvatarImage src={member.memberAvatar} alt={member.memberName ?? ''} />
                    )}
                    <AvatarFallback className="bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                      {getInitials(member.memberName ?? member.invitedEmail)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.memberName ?? member.invitedEmail}
                    </p>
                    {member.memberName && (
                      <p className="truncate text-xs text-muted-foreground">{member.invitedEmail}</p>
                    )}
                  </div>

                  <StatusBadge status={member.status} />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-warm-400 hover:text-red-600 dark:hover:text-red-400"
                    disabled={removeMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t('team.revokeConfirmDescription', { name: member.memberName ?? member.invitedEmail }))) {
                        removeMutation.mutate(member.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
