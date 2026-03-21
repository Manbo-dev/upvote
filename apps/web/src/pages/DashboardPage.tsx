import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCanais, createCanal, renameCanal, deleteCanal } from '../services/canais';
import type { CanalResponse } from '../services/canais';
import { getSubscription } from '../services/subscriptions';
import Modal from '../components/Modal';

export default function DashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [canalName, setCanalName] = useState('');
  const [canalSlug, setCanalSlug] = useState('');

  const [renameTarget, setRenameTarget] = useState<CanalResponse | null>(null);
  const [renameName, setRenameName] = useState('');

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
    mutationFn: () => renameCanal(renameTarget!.id, renameName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setRenameTarget(null);
      setRenameName('');
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

  const handleNameChange = (name: string) => {
    setCanalName(name);
    setCanalSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

  const openRenameModal = (canal: CanalResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRenameTarget(canal);
    setRenameName(canal.name);
  };

  const openDeleteModal = (canal: CanalResponse, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(canal);
    setDeleteConfirmText('');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Canais</h1>
        {limiteAtingido ? (
          <Link
            to="/dashboard/billing"
            className="rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            Limite atingido - Fazer upgrade
          </Link>
        ) : (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Novo Canal
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : canais?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum canal ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Crie seu primeiro canal para comecar a coletar feedback.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canais?.map((canal) => (
            <div key={canal.id} className="group relative">
              <Link
                to={`/dashboard/${canal.slug}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
              >
                <div
                  className="mb-3 h-2 w-12 rounded-full"
                  style={{ backgroundColor: canal.widgetColor }}
                />
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 dark:text-white">
                  {canal.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">/{canal.slug}</p>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Criado em{' '}
                  {new Date(canal.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </Link>
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => openRenameModal(canal, e)}
                  title="Renomear canal"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => openDeleteModal(canal, e)}
                  title="Deletar canal"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: criar novo canal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Novo Canal"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nome do Canal
            </label>
            <input
              type="text"
              value={canalName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="Ex: Checkout"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slug (URL)
            </label>
            <input
              type="text"
              value={canalSlug}
              onChange={(e) => setCanalSlug(e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="meu-app"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Apenas letras minusculas, numeros e hifens
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: renomear canal */}
      <Modal
        isOpen={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title="Renomear Canal"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            renameMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Novo nome
            </label>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRenameTarget(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={renameMutation.isPending || renameName.trim() === ''}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {renameMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: deletar canal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
        title="Deletar Canal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Esta ação é irreversível. Todos os feedbacks e dados do canal{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {deleteTarget?.name}
            </span>{' '}
            serão permanentemente deletados.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Digite <span className="font-mono font-semibold">deletar</span> para confirmar
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              autoFocus
              placeholder="deletar"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteConfirmText !== 'deletar' || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar Canal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
