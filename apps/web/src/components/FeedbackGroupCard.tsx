import { useDraggable } from '@dnd-kit/core';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import type { SuggestionStatus } from '../services/suggestions';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';

const ALL_STATUSES: { value: SuggestionStatus; label: string }[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CLOSED', label: 'Closed' },
];

interface FeedbackGroupCardProps {
  group: FeedbackGroupResponse;
  onClick: () => void;
  onStatusChange?: (id: string, status: SuggestionStatus) => void;
  compact?: boolean;
}

export default function FeedbackGroupCard({
  group,
  onClick,
  onStatusChange,
  compact = false,
}: FeedbackGroupCardProps) {
  const timeAgo = getRelativeTime(group.updatedAt);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: group.id,
  });

  const dragStyle = isDragging ? 'opacity-40' : '';

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        className={`group cursor-grab rounded-lg border border-gray-200 bg-white p-3 transition-all active:cursor-grabbing hover:border-primary-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-700 ${dragStyle}`}
        {...listeners}
        {...attributes}
      >
        <div className="mb-1.5 flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-primary-50 text-xs font-bold text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
            {group.voteCount}
          </span>
          <h3
            className="flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {group.title}
          </h3>
        </div>

        {group.summary && (
          <p className="mb-2 text-xs text-gray-600 line-clamp-2 dark:text-gray-400">
            {group.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={group.category} />
          {group.topContext && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {group.topContext}
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{timeAgo}</span>
        </div>

        {/* Inline status selector */}
        {onStatusChange && (
          <div
            className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <select
              value={group.status}
              onChange={(e) =>
                onStatusChange(group.id, e.target.value as SuggestionStatus)
              }
              className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 focus:border-primary-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex cursor-grab gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all active:cursor-grabbing hover:border-primary-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-primary-700 ${dragStyle}`}
      {...listeners}
      {...attributes}
    >
      {/* Vote count */}
      <div className="flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 border-primary-500 bg-primary-50 text-sm font-bold text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        {group.voteCount}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3
            className="truncate font-semibold text-gray-900 dark:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {group.title}
          </h3>
          <CategoryBadge category={group.category} />
          <StatusBadge status={group.status} />
        </div>

        {group.summary && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {group.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
          {group.topContext && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {group.topContext}
            </span>
          )}
          <span>Atualizado {timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

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
