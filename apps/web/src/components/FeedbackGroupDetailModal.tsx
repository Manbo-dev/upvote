import { useQuery } from '@tanstack/react-query';
import {
  getFeedbackGroupDetails,
  type FeedbackGroupResponse,
  type FeedbackDetail,
} from '../services/feedbackGroups';
import type { SuggestionStatus } from '../services/suggestions';
import CategoryBadge from './CategoryBadge';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

function getVoteHeatColor(
  voteCount: number,
  maxVotes: number,
  isDark: boolean,
): { background: string; text: string; border: string } {
  const effectiveMax = Math.max(maxVotes, 1);
  const ratio = Math.min(voteCount / effectiveMax, 1);

  // Hue: 220 (blue/cold) → 0 (red/hot)
  const hue = Math.round(220 - ratio * 220);

  if (isDark) {
    const bgSaturation = Math.round(50 + ratio * 40);
    const bgLightness = Math.round(18 + ratio * 4);
    const textLightness = Math.round(60 + ratio * 15);
    return {
      background: `hsl(${hue}, ${bgSaturation}%, ${bgLightness}%)`,
      text: `hsl(${hue}, 85%, ${textLightness}%)`,
      border: `hsl(${hue}, 70%, 30%)`,
    };
  }

  const bgSaturation = Math.round(60 + ratio * 30);
  return {
    background: `hsl(${hue}, ${bgSaturation}%, 93%)`,
    text: `hsl(${hue}, 85%, 30%)`,
    border: `hsl(${hue}, 75%, 75%)`,
  };
}

const ALL_STATUSES: SuggestionStatus[] = [
  'OPEN',
  'PLANNED',
  'IN_PROGRESS',
  'DONE',
  'CLOSED',
];

// Labels legíveis para os tipos de acionamento do widget
const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Botao',
  automatic: 'Automatico',
  event: 'Evento',
};

interface FeedbackGroupDetailModalProps {
  group: FeedbackGroupResponse | null;
  slug: string;
  onClose: () => void;
  onStatusChange: (id: string, status: SuggestionStatus) => void;
  maxVotes: number;
}

export default function FeedbackGroupDetailModal({
  group,
  onClose,
  onStatusChange,
  maxVotes,
}: FeedbackGroupDetailModalProps) {
  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedback-group-details', group?.id],
    queryFn: () => getFeedbackGroupDetails(group!.id),
    enabled: !!group,
  });

  if (!group) return null;

  const isDark = document.documentElement.classList.contains('dark');
  const heatColors = getVoteHeatColor(group.voteCount, maxVotes, isDark);

  return (
    <Modal isOpen={!!group} onClose={onClose} title={group.title}>
      <div className="space-y-5">
        {/* Resumo e status */}
        <div>
          <div className="mb-2">
            <CategoryBadge category={group.category} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{group.summary}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <select
              value={group.status}
              onChange={(e) =>
                onStatusChange(group.id, e.target.value as SuggestionStatus)
              }
              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <StatusBadge status={group.status} />
          </div>
        </div>

        {/* Contexto principal */}
        {group.topContext && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Contexto principal:
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300">{group.topContext}</p>
          </div>
        )}

        {/* Vote count heat badge */}
        <div className="flex items-center gap-2">
          <span
            style={{
              background: heatColors.background,
              color: heatColors.text,
              border: `1px solid ${heatColors.border}`,
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {group.voteCount}{' '}
            {group.voteCount === 1 ? 'relato' : 'relatos'}
          </span>
        </div>

        {/* Lista de feedbacks individuais */}
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Feedbacks agrupados
          </h4>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : feedbacks?.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Nenhum feedback individual encontrado.
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {feedbacks?.map((feedback: FeedbackDetail) => (
                <FeedbackItem key={feedback.id} feedback={feedback} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/**
 * Item individual de feedback dentro do modal de detalhes
 */
function FeedbackItem({ feedback }: { feedback: FeedbackDetail }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
      {/* Mensagem original */}
      <div className="mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Mensagem original:
        </span>
        <p className="text-sm text-gray-800 dark:text-gray-200">{feedback.rawMessage}</p>
      </div>

      {/* Mensagem sintetizada pela IA */}
      {feedback.synthesizedMessage && (
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Sintese da IA:
          </span>
          <p className="text-sm text-gray-600 italic dark:text-gray-400">
            {feedback.synthesizedMessage}
          </p>
        </div>
      )}

      {/* Metadados de contexto */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-400 dark:text-gray-500">
        {feedback.pageTitle && (
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {feedback.pageTitle}
          </span>
        )}
        {feedback.lastInteraction && (
          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            {feedback.lastInteraction}
          </span>
        )}
        {feedback.triggerType && (
          <span className="rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            {TRIGGER_LABELS[feedback.triggerType] || feedback.triggerType}
          </span>
        )}
        {feedback.deviceType && (
          <span className="rounded bg-white px-2 py-0.5 dark:bg-gray-700 dark:text-gray-300">
            {feedback.deviceType === 'mobile' ? 'Mobile' : 'Desktop'}
          </span>
        )}
        <span>
          {new Date(feedback.createdAt).toLocaleDateString('pt-BR', {
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
