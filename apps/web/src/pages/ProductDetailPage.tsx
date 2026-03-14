import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getFeedbackGroups,
  type FeedbackGroupResponse,
} from '../services/feedbackGroups';
import type { SuggestionStatus } from '../services/suggestions';
import FeedbackGroupCard from '../components/FeedbackGroupCard';
import FeedbackGroupDetailModal from '../components/FeedbackGroupDetailModal';

const STATUS_TABS: { label: string; value: SuggestionStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Abertas', value: 'OPEN' },
  { label: 'Planejadas', value: 'PLANNED' },
  { label: 'Em Progresso', value: 'IN_PROGRESS' },
  { label: 'Concluidas', value: 'DONE' },
];

export default function ProductDetailPage() {
  const { productId: slug } = useParams<{ productId: string }>();
  const [activeTab, setActiveTab] = useState<SuggestionStatus | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] =
    useState<FeedbackGroupResponse | null>(null);

  // Busca grupos de feedback do produto
  const { data: feedbackGroups, isLoading } = useQuery({
    queryKey: ['feedback-groups', slug],
    queryFn: () => getFeedbackGroups(slug!),
    enabled: !!slug,
  });

  // Filtra grupos pelo status selecionado
  const filtered =
    activeTab === 'ALL'
      ? feedbackGroups
      : feedbackGroups?.filter((g) => g.status === activeTab);

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedbacks</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Feedbacks capturados pelo widget sao agrupados automaticamente pela IA
        </p>
      </div>

      {/* Filtro por status */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de grupos de feedback */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : filtered?.length === 0 || !filtered ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum feedback recebido ainda
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Instale o widget no seu produto para comecar a capturar feedbacks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => (
            <FeedbackGroupCard
              key={group.id}
              group={group}
              onClick={() => setSelectedGroup(group)}
            />
          ))}
        </div>
      )}

      {/* Modal de detalhes do grupo */}
      <FeedbackGroupDetailModal
        group={selectedGroup}
        slug={slug!}
        onClose={() => setSelectedGroup(null)}
      />
    </div>
  );
}
