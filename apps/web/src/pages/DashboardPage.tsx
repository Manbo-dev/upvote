import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, Package } from 'lucide-react';
import { getCanais, createCanal, renameCanal, deleteCanal } from '../services/canais';
import type { CanalResponse } from '../services/canais';
import { getSubscription } from '../services/subscriptions';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [canalName, setCanalName] = useState('');
  const [canalSlug, setCanalSlug] = useState('');

  const [renameTarget, setRenameTarget] = useState<CanalResponse | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameSlug, setRenameSlug] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<CanalResponse | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: canais, isLoading } = useQuery({
    queryKey: ['canais'],
    queryFn: getCanais,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscription,
  });

  const limiteAtingido = subscription
    ? subscription.canaisAtivos >= subscription.limiteCanais
    : false;

  const createMutation = useMutation({
    mutationFn: () => createCanal({ name: canalName, slug: canalSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setIsCreateModalOpen(false);
      setCanalName('');
      setCanalSlug('');
    },
  });

  const renameMutation = useMutation({
    mutationFn: () => renameCanal(renameTarget!.id, renameName, renameSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setRenameTarget(null);
      setRenameName('');
      setRenameSlug('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCanal(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setDeleteTarget(null);
      setDeleteConfirmText('');
      navigate('/dashboard');
    },
  });

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (name: string) => {
    setCanalName(name);
    setCanalSlug(toSlug(name));
  };

  const handleRenameNameChange = (name: string) => {
    setRenameName(name);
    setRenameSlug(toSlug(name));
  };

  const openRenameModal = (canal: CanalResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameTarget(canal);
    setRenameName(canal.name);
    setRenameSlug(canal.slug);
  };

  const openDeleteModal = (canal: CanalResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(canal);
    setDeleteConfirmText('');
  };

  const DELETE_CONFIRM_WORD = 'delete';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
        {limiteAtingido ? (
          <Button variant="outline" asChild>
            <Link to="/dashboard/billing">{t('dashboard.limitReached')}</Link>
          </Button>
        ) : (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            {t('dashboard.newChannel')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : canais?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-warm-300 p-12 text-center dark:border-warm-700">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {t('dashboard.empty.title')}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('dashboard.empty.description')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canais?.map((canal) => (
            <div key={canal.id} className="group relative">
              <Link
                to={`/dashboard/${canal.slug}`}
                className="block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary-300 hover:shadow-md dark:hover:border-primary-700"
              >
                <div
                  className="mb-3 h-2 w-12 rounded-full"
                  style={{ backgroundColor: canal.widgetColor }}
                />
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-600">
                  {canal.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">/{canal.slug}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t('dashboard.channelCreatedAt')}{' '}
                  {new Date(canal.createdAt).toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US')}
                </p>
              </Link>
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => openRenameModal(canal, e)}
                  title={t('dashboard.renameChannel')}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => openDeleteModal(canal, e)}
                  title={t('dashboard.deleteChannel')}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog: create new channel */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.modals.createTitle')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label className="mb-1 block">{t('dashboard.modals.channelName')}</Label>
              <Input
                type="text"
                value={canalName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex: Checkout"
              />
            </div>
            <div>
              <Label className="mb-1 block">{t('dashboard.modals.channelSlug')}</Label>
              <Input
                type="text"
                value={canalSlug}
                onChange={(e) => setCanalSlug(e.target.value)}
                required
                pattern="^[a-z0-9-]+$"
                placeholder="my-app"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.modals.slugHint')}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t('dashboard.modals.creating') : t('dashboard.modals.createSubmit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: rename channel */}
      <Dialog open={renameTarget !== null} onOpenChange={(open) => { if (!open) { setRenameTarget(null); setRenameName(''); setRenameSlug(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.modals.renameTitle')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              renameMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label className="mb-1 block">{t('dashboard.modals.newName')}</Label>
              <Input
                type="text"
                value={renameName}
                onChange={(e) => handleRenameNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1 block">{t('dashboard.modals.slugPath')}</Label>
              <div className="flex items-center rounded-md border border-input">
                <span className="pl-3 text-sm text-muted-foreground">/</span>
                <input
                  type="text"
                  value={renameSlug}
                  readOnly
                  className="w-full bg-transparent px-2 py-2 text-sm text-muted-foreground"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('dashboard.modals.slugHint')}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setRenameTarget(null); setRenameName(''); setRenameSlug(''); }}>
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={renameMutation.isPending || renameName.trim() === '' || renameSlug.trim() === ''}
              >
                {renameMutation.isPending ? t('dashboard.modals.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: delete channel */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dashboard.modals.deleteTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.modals.deleteWarning')}{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.name}
              </span>{' '}
              {t('dashboard.modals.deleteWarningEnd')}
            </p>
            <div>
              <Label className="mb-1 block">
                {t('dashboard.modals.deleteConfirmLabel')}{' '}
                <span className="font-mono font-semibold">{DELETE_CONFIRM_WORD}</span>{' '}
                {t('dashboard.modals.deleteConfirmSuffix')}
              </Label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                autoFocus
                placeholder={DELETE_CONFIRM_WORD}
                className="focus-visible:ring-destructive"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== DELETE_CONFIRM_WORD || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? t('dashboard.modals.deleting') : t('dashboard.modals.deleteSubmit')}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
