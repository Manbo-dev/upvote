import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  getFeedbackGroups,
  updateFeedbackGroupStatus,
  updateFeedbackGroupCategory,
  type FeedbackCategory,
  type FeedbackGroupResponse,
} from '../services/feedbackGroups';
import type { SuggestionStatus } from '../services/suggestions';
import FeedbackGroupCard from '../components/FeedbackGroupCard';
import FeedbackGroupDetailModal from '../components/FeedbackGroupDetailModal';
import KanbanColumn from '../components/KanbanColumn';

const CATEGORY_FILTERS: {
  label: string;
  value: FeedbackCategory | 'ALL';
  icon: React.ReactNode;
  activeClasses: string;
}[] = [
  {
    label: 'All',
    value: 'ALL',
    icon: null,
    activeClasses: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
  },
  {
    label: 'Bug',
    value: 'BUG',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeClasses: 'bg-red-600 text-white dark:bg-red-500',
  },
  {
    label: 'Suggestion',
    value: 'SUGGESTION',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    activeClasses: 'bg-blue-600 text-white dark:bg-blue-500',
  },
  {
    label: 'Complaint',
    value: 'COMPLAINT',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeClasses: 'bg-orange-600 text-white dark:bg-orange-500',
  },
  {
    label: 'Praise',
    value: 'PRAISE',
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    activeClasses: 'bg-green-600 text-white dark:bg-green-500',
  },
];

const KANBAN_COLUMNS: {
  status: SuggestionStatus;
  title: string;
  color: string;
}[] = [
  { status: 'OPEN', title: 'Open', color: 'bg-blue-500' },
  { status: 'PLANNED', title: 'Planned', color: 'bg-yellow-500' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-orange-500' },
  { status: 'DONE', title: 'Done', color: 'bg-green-500' },
];

export default function CanalDetailPage() {
  const { canalId: slug } = useParams<{ canalId: string }>();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<FeedbackGroupResponse | null>(null);
  const [draggingGroup, setDraggingGroup] = useState<FeedbackGroupResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { data: feedbackGroups, isLoading } = useQuery({
    queryKey: ['feedback-groups', slug],
    queryFn: () => getFeedbackGroups(slug!),
    enabled: !!slug,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SuggestionStatus }) =>
      updateFeedbackGroupStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['feedback-groups', slug] });
      const previous = queryClient.getQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug]);
      queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
        old?.map((g) => (g.id === id ? { ...g, status } : g)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['feedback-groups', slug], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-groups', slug] });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: FeedbackCategory }) =>
      updateFeedbackGroupCategory(id, category),
    onMutate: async ({ id, category }) => {
      await queryClient.cancelQueries({ queryKey: ['feedback-groups', slug] });
      const previous = queryClient.getQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug]);
      queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
        old?.map((g) => (g.id === id ? { ...g, category } : g)) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['feedback-groups', slug], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-groups', slug] });
    },
  });

  const filtered =
    activeCategory === 'ALL'
      ? feedbackGroups
      : feedbackGroups?.filter((g) => g.category === activeCategory);

  const maxVotes = feedbackGroups
    ? Math.max(0, ...feedbackGroups.map((g) => g.voteCount))
    : 0;

  const groupsByStatus = (status: SuggestionStatus) =>
    filtered?.filter((g) => g.status === status) ?? [];

  function handleDragStart(event: DragStartEvent) {
    const group = feedbackGroups?.find((g) => g.id === event.active.id);
    setDraggingGroup(group ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingGroup(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as SuggestionStatus;
    const group = feedbackGroups?.find((g) => g.id === active.id);
    if (!group || group.status === newStatus) return;

    statusMutation.mutate({ id: group.id, status: newStatus });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedbacks</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Feedbacks capturados pelo widget sao agrupados automaticamente pela IA
        </p>
      </div>

      {/* Category filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = activeCategory === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveCategory(filter.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? filter.activeClasses
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {filter.icon}
              {filter.label}
              {filter.value !== 'ALL' && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs ${
                    isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {feedbackGroups?.filter((g) => g.category === filter.value).length ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : !feedbackGroups || feedbackGroups.length === 0 ? (
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                title={col.title}
                status={col.status}
                color={col.color}
                groups={groupsByStatus(col.status)}
                onCardClick={setSelectedGroup}
                maxVotes={maxVotes}
              />
            ))}
          </div>

          <DragOverlay>
            {draggingGroup ? (
              <div className="rotate-2 opacity-90">
                <FeedbackGroupCard
                  group={draggingGroup}
                  onClick={() => {}}
                  compact
                  maxVotes={maxVotes}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <FeedbackGroupDetailModal
        group={selectedGroup}
        slug={slug!}
        onClose={() => setSelectedGroup(null)}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        onCategoryChange={(id, category) => categoryMutation.mutate({ id, category })}
        maxVotes={maxVotes}
      />
    </div>
  );
}
