import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Archive, RotateCcw, ExternalLink, ChevronUp, Link as LinkIcon } from 'lucide-react';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import { useThemeStore } from '../store/themeStore';
import { categoryAccents } from '../design-system/tokens';
import CategoryBadge from './CategoryBadge';
import StatusBadge from './StatusBadge';

function getVoteHeatColor(voteCount: number, maxVotes: number, isDark: boolean) {
  const ratio = maxVotes > 1 ? Math.min(voteCount / maxVotes, 1) : 0;
  const hue = Math.round(220 - ratio * 180);
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
  const accentColor = categoryAccents[group.category as keyof typeof categoryAccents];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: group.id,
  });

  const dragStyle = isDragging ? 'opacity-40' : '';

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        className={`group cursor-grab rounded-lg border border-warm-200 border-l-4 bg-card p-3 transition-all active:cursor-grabbing hover:border-primary-300 hover:shadow-md dark:border-warm-700 dark:hover:border-primary-600 ${dragStyle}`}
        style={{ borderLeftColor: accentColor?.border }}
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
            className="flex-1 truncate text-sm font-semibold text-foreground"
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
              className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
              title={t('card.archive')}
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
          {onRestore && (
            <button
              onClick={(e) => { e.stopPropagation(); onRestore(); }}
              className="flex-shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
              title={t('card.restore')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {group.summary && (
          <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
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
              <ExternalLink className="h-3 w-3" />
              {issue.externalId}
            </a>
          ))}
          {group.topContext && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-xs text-muted-foreground dark:bg-warm-800">
              {group.topContext}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{timeAgo}</span>
        </div>

      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex cursor-grab gap-4 rounded-lg border border-warm-200 border-l-4 bg-card p-4 transition-all active:cursor-grabbing hover:border-primary-300 hover:shadow-md dark:border-warm-700 dark:hover:border-primary-600 ${dragStyle}`}
      style={{ borderLeftColor: accentColor?.border }}
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
        <ChevronUp className="h-4 w-4" />
        {group.voteCount}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3
            className="truncate font-semibold text-foreground"
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
              <ExternalLink className="h-3 w-3" />
              {issue.externalId}
            </a>
          ))}
        </div>

        {group.summary && (
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {group.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {group.topContext && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-600 dark:bg-warm-800 dark:text-warm-400">
              <LinkIcon className="h-3 w-3" />
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
