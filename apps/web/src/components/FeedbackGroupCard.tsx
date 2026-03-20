import { useDraggable } from '@dnd-kit/core';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import { useThemeStore } from '../store/themeStore';
import { getVoteHeatColor } from '../utils/voteHeat';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';

interface FeedbackGroupCardProps {
  group: FeedbackGroupResponse;
  onClick: () => void;
  compact?: boolean;
  maxVotes?: number;
}

export default function FeedbackGroupCard({
  group,
  onClick,
  compact = false,
  maxVotes = 1,
}: FeedbackGroupCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const heatColor = getVoteHeatColor(group.voteCount, maxVotes, isDark);
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
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold"
            style={{ background: heatColor.background, color: heatColor.text }}
          >
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
      <div
        className="flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border-2 text-sm font-bold"
        style={{
          background: heatColor.background,
          color: heatColor.text,
          borderColor: heatColor.border,
        }}
      >
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
