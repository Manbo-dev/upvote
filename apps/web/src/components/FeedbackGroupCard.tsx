import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import StatusBadge from './StatusBadge';

interface FeedbackGroupCardProps {
  group: FeedbackGroupResponse;
  onClick: () => void;
}

/**
 * Card que exibe um padrão de feedback agrupado pela IA.
 * Mostra contagem de votos, título sintetizado, resumo, contexto e status.
 */
export default function FeedbackGroupCard({
  group,
  onClick,
}: FeedbackGroupCardProps) {
  // Calcula tempo relativo desde a última atualização
  const timeAgo = getRelativeTime(group.updatedAt);

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700"
    >
      {/* Contagem de votos/relatos */}
      <div className="flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 border-primary-500 bg-primary-50 text-sm font-bold text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
        {group.voteCount}
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate dark:text-white">
            {group.title}
          </h3>
          <StatusBadge status={group.status} />
        </div>

        {group.summary && (
          <p className="mb-2 text-sm text-gray-600 line-clamp-2 dark:text-gray-400">
            {group.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          {/* Contexto principal */}
          {group.topContext && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {group.topContext}
            </span>
          )}

          {/* Timestamp relativo */}
          <span>Atualizado {timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Retorna uma string de tempo relativo em português
 */
function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `ha ${diffMinutes} min`;
  if (diffHours < 24) return `ha ${diffHours}h`;
  if (diffDays < 7) return `ha ${diffDays}d`;
  return date.toLocaleDateString('pt-BR');
}
