import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCanais, createCanal } from '../services/canais';
import Modal from '../components/Modal';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [canalName, setCanalName] = useState('');
  const [canalSlug, setCanalSlug] = useState('');
  const queryClient = useQueryClient();

  const { data: canais, isLoading } = useQuery({
    queryKey: ['canais'],
    queryFn: getCanais,
  });

  const createMutation = useMutation({
    mutationFn: () => createCanal({ name: canalName, slug: canalSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canais'] });
      setIsModalOpen(false);
      setCanalName('');
      setCanalSlug('');
    },
  });

  // Gera slug automaticamente a partir do nome
  const handleNameChange = (name: string) => {
    setCanalName(name);
    setCanalSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Canais</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Novo Canal
        </button>
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
            <Link
              key={canal.id}
              to={`/dashboard/${canal.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
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
          ))}
        </div>
      )}

      {/* Modal para criar novo canal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
              onClick={() => setIsModalOpen(false)}
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
    </div>
  );
}
