import clsx from 'clsx';
import type { SuggestionStatus } from '../services/suggestions';

const statusConfig: Record<
  SuggestionStatus,
  { label: string; className: string }
> = {
  OPEN: { label: 'Aberta', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  PLANNED: { label: 'Planejada', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  IN_PROGRESS: {
    label: 'Em Progresso',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  DONE: { label: 'Concluída', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  CLOSED: { label: 'Fechada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
};

interface StatusBadgeProps {
  status: SuggestionStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
