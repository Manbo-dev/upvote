import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, createProduct } from '../services/products';
import Modal from '../components/Modal';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const createMutation = useMutation({
    mutationFn: () => createProduct({ name: productName, slug: productSlug }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setProductName('');
      setProductSlug('');
    },
  });

  // Gera slug automaticamente a partir do nome
  const handleNameChange = (name: string) => {
    setProductName(name);
    setProductSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Novo Produto
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : products?.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Nenhum produto ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Crie seu primeiro produto para comecar a coletar feedback.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products?.map((product) => (
            <Link
              key={product.id}
              to={`/dashboard/${product.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md"
            >
              <div
                className="mb-3 h-2 w-12 rounded-full"
                style={{ backgroundColor: product.widgetColor }}
              />
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">/{product.slug}</p>
              <p className="mt-3 text-xs text-gray-400">
                Criado em{' '}
                {new Date(product.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Modal para criar novo produto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Produto"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nome do Produto
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Ex: Meu App"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Slug (URL)
            </label>
            <input
              type="text"
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
              required
              pattern="^[a-z0-9-]+$"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="meu-app"
            />
            <p className="mt-1 text-xs text-gray-400">
              Apenas letras minusculas, numeros e hifens
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
