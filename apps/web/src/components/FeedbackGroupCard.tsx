import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import { useThemeStore } from '../store/themeStore';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';

function getVoteHeatColor(voteCount: number, maxVotes: number, isDark: boolean) {
  const ratio = maxVotes > 1 ? Math.min(voteCount / maxVotes, 1) : 0;
  const hue = Math.round(220 - ratio * 180); // 220 (blue) → 40 (yellow) → 0 (red)
  const saturation = isDark ? 70 : 80;
  const lightness = isDark ? 35 : 88;
  const textLightness = isDark ? 85 : 25;
  const borderLightness = isDark ? 50 : 65;
  return {
    background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: `hsl(${hue}, ${saturation}%, ${textLightness}%)`,
    border: `hsl(${hue}, ${saturation}%, ${borderLightness}%)`,
  };
}

interface FeedbackGroupCardProps {
  group: FeedbackGroupResponse;
  onClick: () => void;
  compact?: boolean;
  maxVotes?: number;
  onArchive?: () => void;
  onRestore?: () => void;
}

export default function FeedbackGroupCard({
  group,
  onClick,
  compact = false,
  maxVotes = 1,
  onArchive,
  onRestore,
}: FeedbackGroupCardProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const heatColor = getVoteHeatColor(group.voteCount, maxVotes, isDark);
  const timeAgo = getRelativeTime(group.updatedAt, t, i18n.language);

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
          {onArchive && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(); }}
              className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title={t('card.archive')}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}
          {onRestore && (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(); }}
              className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              title={t('card.restore')}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {group.summary && (
          <p className="mb-2 text-xs text-gray-600 line-clamp-2 dark:text-gray-400">
            {group.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={group.category} />
          {group.externalIssues?.map((issue) => (
            <a
              key={issue.id}
              href={issue.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:opacity-80 ${
                issue.provider === 'JIRA'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              }`}
              title={`${issue.provider}: ${issue.externalStatus || ''}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {issue.externalId}
            </a>
          ))}
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
          {group.externalIssues?.map((issue) => (
            <a
              key={issue.id}
              href={issue.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all hover:opacity-80 ${
                issue.provider === 'JIRA'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              }`}
              title={`${issue.provider}: ${issue.externalStatus || ''}`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {issue.externalId}
            </a>
          ))}
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
          <span>{t('card.updatedAgo')} {timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string, t: TFunction, lang: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return t('card.justNow');
  if (diffMinutes < 60) return t('card.minutesAgo', { count: diffMinutes });
  if (diffHours < 24) return t('card.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('card.daysAgo', { count: diffDays });
  return date.toLocaleDateString(lang === 'pt-BR' ? 'pt-BR' : 'en-US');
}
