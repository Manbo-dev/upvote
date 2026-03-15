import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts, ProductResponse } from '../services/products';

export default function ApiKeysPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        Chaves de API
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Use a chave de API de cada produto para configurar o widget no seu site.
      </p>

      <ProductKeyList />
    </div>
  );
}

function ProductKeyList() {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        Erro ao carregar produtos.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum produto encontrado. Crie um produto primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductKeyCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductKeyCard({ product }: { product: ProductResponse }) {
  const [visivel, setVisivel] = useState(false);
  const [copiado, setCopiado] = useState<'key' | 'snippet' | null>(null);

  const keyMascarada = product.apiKey
    ? `${product.apiKey.slice(0, 8)}${'*'.repeat(36)}${product.apiKey.slice(-8)}`
    : '';

  const snippet = `<script
  src="https://cdn.upvote.com/widget.js"
  data-api-key="${product.apiKey}"
  data-color="${product.widgetColor}"
  data-base-url="https://api.upvote.com">
</script>`;

  const copiar = async (texto: string, tipo: 'key' | 'snippet') => {
    await navigator.clipboard.writeText(texto);
    setCopiado(tipo);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {product.name}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {product.slug}
        </span>
      </div>

      {/* Chave de API */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Chave de API
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {visivel ? product.apiKey : keyMascarada}
          </code>
          <button
            onClick={() => setVisivel(!visivel)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title={visivel ? 'Ocultar' : 'Revelar'}
          >
            {visivel ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => copiar(product.apiKey, 'key')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Copiar chave"
          >
            {copiado === 'key' ? (
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Snippet de instalacao */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Codigo de instalacao
          </label>
          <button
            onClick={() => copiar(snippet, 'snippet')}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {copiado === 'snippet' ? 'Copiado!' : 'Copiar snippet'}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
