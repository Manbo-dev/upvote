import { useDroppable } from '@dnd-kit/core';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import type { SuggestionStatus } from '../services/suggestions';
import FeedbackGroupCard from './FeedbackGroupCard';

interface KanbanColumnProps {
  title: string;
  status: SuggestionStatus;
  groups: FeedbackGroupResponse[];
  color: string;
  onCardClick: (group: FeedbackGroupResponse) => void;
}

export default function KanbanColumn({
  title,
  status,
  groups,
  color,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[280px] flex-col rounded-xl transition-colors ${
        isOver
          ? 'bg-primary-50 ring-2 ring-primary-300 dark:bg-primary-900/20 dark:ring-primary-600'
          : 'bg-gray-50 dark:bg-gray-800/50'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          {groups.length}
        </span>
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
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">No feedbacks</p>
          </div>
        ) : (
          groups.map((group) => (
            <FeedbackGroupCard
              key={group.id}
              group={group}
              onClick={() => onCardClick(group)}
              compact
            />
          ))
        )}
      </div>
    </div>
  );
}
