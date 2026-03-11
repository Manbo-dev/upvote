import clsx from 'clsx';
import type { SuggestionResponse } from '../services/suggestions';
import StatusBadge from './StatusBadge';

interface SuggestionCardProps {
  suggestion: SuggestionResponse;
  onVote: (id: string) => void;
  onClick?: () => void;
  isVoting?: boolean;
}

/**
 * Card de sugestão com botão de voto, status e informações do autor
 */
export default function SuggestionCard({
  suggestion,
  onVote,
  onClick,
  isVoting,
}: SuggestionCardProps) {
  return (
    <div
      className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      {/* Botão de voto */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onVote(suggestion.id);
        }}
        disabled={isVoting}
        className={clsx(
          'flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 text-sm font-bold transition-colors',
          suggestion.votedByCurrentUser
            ? 'border-primary-500 bg-primary-50 text-primary-600'
            : 'border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-500',
        )}
      >
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
        {suggestion.voteCount}
      </button>

      {/* Conteúdo */}
      <div
        className="flex-1 cursor-pointer"
        onClick={onClick}
      >
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
          <StatusBadge status={suggestion.status} />
        </div>
        {suggestion.description && (
          <p className="mb-2 text-sm text-gray-600 line-clamp-2">
            {suggestion.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{suggestion.authorName}</span>
          <span>
            {new Date(suggestion.createdAt).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  );
}
