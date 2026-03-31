import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { getCanais, CanalResponse } from '../services/canais';

export default function ApiKeysPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t('apiKeys.title')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t('apiKeys.description')}
      </p>

      <CanalKeyList />
    </div>
  );
}

function CanalKeyList() {
  const { t } = useTranslation();
  const { data: canais, isLoading, error } = useQuery({
    queryKey: ['canais'],
    queryFn: getCanais,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('apiKeys.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">
        {t('apiKeys.error')}
      </div>
    );
  }

  if (!canais || canais.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('apiKeys.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canais.map((canal) => (
        <CanalKeyCard key={canal.id} canal={canal} />
      ))}
    </div>
  );
}

function CanalKeyCard({ canal }: { canal: CanalResponse }) {
  const { t } = useTranslation();
  const [visivel, setVisivel] = useState(false);
  const [copiado, setCopiado] = useState<'key' | 'snippet' | null>(null);

  const keyMascarada = canal.apiKey
    ? `${canal.apiKey.slice(0, 8)}${'*'.repeat(36)}${canal.apiKey.slice(-8)}`
    : '';

  const snippet = `<script
  src="https://cdn.upvote.pro/widget.js"
  data-api-key="${canal.apiKey}"
  data-color="${canal.widgetColor}"
  data-base-url="https://api.upvote.pro">
</script>`;

  const copiar = async (texto: string, tipo: 'key' | 'snippet') => {
    await navigator.clipboard.writeText(texto);
    setCopiado(tipo);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {canal.name}
        </h2>
        <span className="text-xs text-muted-foreground">
          {canal.slug}
        </span>
      </div>

      {/* API Key */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-foreground">
          {t('apiKeys.apiKey')}
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg border border-input bg-muted px-3 py-2 text-sm font-mono text-muted-foreground">
            {visivel ? canal.apiKey : keyMascarada}
          </code>
          <button
            onClick={() => setVisivel(!visivel)}
            className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={visivel ? t('apiKeys.hide') : t('apiKeys.reveal')}
          >
            {visivel ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => copiar(canal.apiKey, 'key')}
            className="rounded-lg border border-input px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={t('apiKeys.copyKey')}
          >
            {copiado === 'key' ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Installation snippet */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">
            {t('apiKeys.installCode')}
          </label>
          <button
            onClick={() => copiar(snippet, 'snippet')}
            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {copiado === 'snippet' ? t('apiKeys.copied') : t('apiKeys.copySnippet')}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
          {snippet}
        </pre>
      </div>
    </div>
  );
}
