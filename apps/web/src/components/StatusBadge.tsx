import clsx from 'clsx';
import type { SuggestionStatus } from '../services/suggestions';

const statusConfig: Record<
  SuggestionStatus,
  { label: string; className: string }
> = {
  OPEN: { label: 'Aberta', className: 'bg-blue-100 text-blue-800' },
  PLANNED: { label: 'Planejada', className: 'bg-yellow-100 text-yellow-800' },
  IN_PROGRESS: {
    label: 'Em Progresso',
    className: 'bg-orange-100 text-orange-800',
  },
  DONE: { label: 'Concluída', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Fechada', className: 'bg-gray-100 text-gray-800' },
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
