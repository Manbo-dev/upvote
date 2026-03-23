import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getFeedbackGroupDetails,
  type FeedbackCategory,
  type FeedbackGroupResponse,
  type FeedbackDetail,
} from '../services/feedbackGroups';
import type { FeedbackGroupStatus } from '../services/feedbackGroups';
import Modal from './Modal';
import PushToExternalModal from './PushToExternalModal';

interface FeedbackGroupDetailModalProps {
  group: FeedbackGroupResponse | null;
  slug: string;
  onClose: () => void;
  onStatusChange: (id: string, status: FeedbackGroupStatus) => void;
  onCategoryChange: (id: string, category: FeedbackCategory) => void;
  maxVotes: number;
}

const STATUS_STYLES: Record<FeedbackGroupStatus, { dotClass: string; activeClasses: string }> = {
  OPEN: { dotClass: 'bg-blue-500', activeClasses: 'bg-blue-100 text-blue-700 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-600' },
  PLANNED: { dotClass: 'bg-yellow-500', activeClasses: 'bg-yellow-100 text-yellow-700 ring-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-600' },
  IN_PROGRESS: { dotClass: 'bg-orange-500', activeClasses: 'bg-orange-100 text-orange-700 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-600' },
  DONE: { dotClass: 'bg-green-500', activeClasses: 'bg-green-100 text-green-700 ring-green-400 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-600' },
  CLOSED: { dotClass: 'bg-gray-400', activeClasses: 'bg-gray-100 text-gray-700 ring-gray-400 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-600' },
  ARCHIVED: { dotClass: 'bg-purple-500', activeClasses: 'bg-purple-100 text-purple-700 ring-purple-400 dark:bg-purple-900/40 dark:text-purple-300 dark:ring-purple-600' },
};

const CATEGORY_STYLES: Record<FeedbackCategory, { activeClasses: string; icon: React.ReactNode }> = {
  BUG: {
    activeClasses: 'bg-red-100 text-red-700 ring-red-400 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-600',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  SUGGESTION: {
    activeClasses: 'bg-blue-100 text-blue-700 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-600',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  COMPLAINT: {
    activeClasses: 'bg-orange-100 text-orange-700 ring-orange-400 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-600',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  PRAISE: {
    activeClasses: 'bg-green-100 text-green-700 ring-green-400 dark:bg-green-900/40 dark:text-green-300 dark:ring-green-600',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
};

const STATUS_OPTIONS: FeedbackGroupStatus[] = ['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE', 'CLOSED'];
const CATEGORY_OPTIONS: FeedbackCategory[] = ['BUG', 'SUGGESTION', 'COMPLAINT', 'PRAISE'];

export default function FeedbackGroupDetailModal({
  group,
  onClose,
  onStatusChange,
  onCategoryChange,
}: FeedbackGroupDetailModalProps) {
  const { t, i18n } = useTranslation();
  const [showPushModal, setShowPushModal] = useState(false);

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedback-group-details', group?.id],
    queryFn: () => getFeedbackGroupDetails(group!.id),
    enabled: !!group,
  });

  if (!group) return null;

  return (
    <Modal isOpen={!!group} onClose={onClose} title={group.title}>
      <div className="space-y-5">
        {/* Category */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('modal.feedbackDetail.category')}</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((value) => {
              const style = CATEGORY_STYLES[value];
              const isActive = group.category === value;
              return (
                <button
                  key={value}
                  onClick={() => onCategoryChange(group.id, value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? `ring-2 ${style.activeClasses}`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {style.icon}
                  {t(`category.${value}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{group.summary}</p>
        </div>

        {/* Status */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{t('modal.feedbackDetail.status')}</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((value) => {
              const style = STATUS_STYLES[value];
              const isActive = group.status === value;
              return (
                <button
                  key={value}
                  onClick={() => onStatusChange(group.id, value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isActive
                      ? `ring-2 ${style.activeClasses}`
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? style.dotClass : 'bg-gray-400 dark:bg-gray-500'}`} />
                  {t(`status.${value}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main context */}
        {group.topContext && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('modal.feedbackDetail.mainContext')}
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300">{group.topContext}</p>
          </div>
        )}

        {/* Vote count + Push to external */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {group.voteCount}{' '}
            {group.voteCount === 1
              ? t('modal.feedbackDetail.reports')
              : t('modal.feedbackDetail.reportsPlural')}
          </span>

          {/* External issue badges */}
          {group.externalIssues?.map((issue) => (
            <a
              key={issue.id}
              href={issue.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-all hover:opacity-80 ${
                issue.provider === 'JIRA'
                  ? 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {issue.externalId}
              {issue.externalStatus && (
                <span className="text-xs opacity-70">· {issue.externalStatus}</span>
              )}
            </a>
          ))}

          {/* Push button */}
          <button
            onClick={() => setShowPushModal(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t('integrations.push.pushButton')}
          </button>
        </div>

        {/* Individual feedbacks list */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('modal.feedbackDetail.groupedFeedbacks')}
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : feedbacks?.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t('modal.feedbackDetail.noFeedbacks')}
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {feedbacks?.map((feedback: FeedbackDetail) => (
                <FeedbackItem key={feedback.id} feedback={feedback} lang={i18n.language} />
              ))}
            </div>
          )}
        </div>
      </div>
      {showPushModal && (
        <PushToExternalModal
          isOpen={showPushModal}
          feedbackGroupId={group.id}
          feedbackGroupTitle={group.title}
          onClose={() => setShowPushModal(false)}
        />
      )}
    </Modal>
  );
}

function FeedbackItem({ feedback, lang }: { feedback: FeedbackDetail; lang: string }) {
  const { t } = useTranslation();

  const triggerLabel = t(`modal.feedbackDetail.triggerLabels.${feedback.triggerType}`, {
    defaultValue: feedback.triggerType,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Original message */}
      <div className="mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {t('modal.feedbackDetail.originalMessage')}
        </span>
        <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.rawMessage}</p>
      </div>

      {/* AI synthesized message */}
      {feedback.synthesizedMessage && (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {t('modal.feedbackDetail.aiSynthesis')}
          </span>
          <p className="text-sm text-gray-600 italic dark:text-gray-400">
            {feedback.synthesizedMessage}
          </p>
        </div>
      )}

      {/* Context metadata */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
        {feedback.pageTitle && (
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {feedback.pageTitle}
          </span>
        )}
        {feedback.lastInteraction && (
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            {feedback.lastInteraction}
          </span>
        )}
        {feedback.triggerType && (
          <span className="rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            {triggerLabel}
          </span>
        )}
        {feedback.deviceType && (
          <span className="rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            {feedback.deviceType === 'mobile' ? 'Mobile' : 'Desktop'}
          </span>
        )}
        <span>
          {new Date(feedback.createdAt).toLocaleDateString(lang === 'pt-BR' ? 'pt-BR' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
