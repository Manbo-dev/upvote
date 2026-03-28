import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import type { FeedbackGroupStatus } from '../services/feedbackGroups';
import { statusTokens } from '../design-system/tokens';

interface StatusBadgeProps {
  status: FeedbackGroupStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusTokens[status],
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
