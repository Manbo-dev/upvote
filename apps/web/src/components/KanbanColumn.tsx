import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import type { FeedbackGroupStatus } from '../services/feedbackGroups';
import FeedbackGroupCard from './FeedbackGroupCard';

interface KanbanColumnProps {
  title: string;
  status: FeedbackGroupStatus;
  groups: FeedbackGroupResponse[];
  color: string;
  onCardClick: (group: FeedbackGroupResponse) => void;
  maxVotes?: number;
  headerAction?: React.ReactNode;
  onArchive?: (groupId: string) => void;
}

export default function KanbanColumn({
  title,
  status,
  groups,
  color,
  onCardClick,
  maxVotes = 1,
  headerAction,
  onArchive,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[280px] flex-col rounded-xl transition-colors ${
        isOver
          ? 'bg-primary-50 ring-2 ring-primary-300 dark:bg-primary-900/20 dark:ring-primary-600'
          : 'border border-warm-200 bg-warm-50 dark:border-warm-700/50 dark:bg-warm-900/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-warm-200 px-2 py-0.5 text-xs font-medium text-warm-600 dark:bg-warm-700 dark:text-warm-400">
          {groups.length}
        </span>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </div>

      {/* Cards */}
      <div
        className="flex-1 space-y-2 overflow-y-auto px-2 pb-3"
        style={{ maxHeight: '65vh' }}
      >
        {groups.length === 0 ? (
          <div
            className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
              isOver
                ? 'border-primary-400 dark:border-primary-600'
                : 'border-warm-200 dark:border-warm-700'
            }`}
          >
            <p className="text-xs text-muted-foreground">{t('kanbanColumn.noFeedbacks')}</p>
          </div>
        ) : (
          groups.map((group) => (
            <FeedbackGroupCard
              key={group.id}
              group={group}
              onClick={() => onCardClick(group)}
              compact
              maxVotes={maxVotes}
              onArchive={onArchive ? () => onArchive(group.id) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
