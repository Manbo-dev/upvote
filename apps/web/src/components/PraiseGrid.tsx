import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import type { FeedbackGroupResponse } from '../services/feedbackGroups';
import FeedbackGroupCard from './FeedbackGroupCard';

interface PraiseGridProps {
  groups: FeedbackGroupResponse[];
  maxVotes: number;
  onCardClick: (group: FeedbackGroupResponse) => void;
  onArchive?: (id: string) => void;
}

export default function PraiseGrid({ groups, maxVotes, onCardClick, onArchive }: PraiseGridProps) {
  const { t } = useTranslation();

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-green-200 p-12 text-center dark:border-green-800/40">
        <Heart className="mx-auto h-12 w-12 text-green-400 dark:text-green-600" />
        <h3 className="mt-4 text-lg font-medium text-foreground">
          {t('canal.praise.emptyTitle')}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('canal.praise.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-100 bg-green-50/30 p-6 dark:border-green-900/30 dark:bg-green-950/10">
      <p className="mb-4 text-sm text-muted-foreground">
        {t('canal.praise.subtitle')}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <FeedbackGroupCard
            key={group.id}
            group={group}
            onClick={() => onCardClick(group)}
            maxVotes={maxVotes}
            draggable={false}
            showStatus={false}
            onArchive={onArchive ? () => onArchive(group.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
