import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getFeedbackGroups,
  restoreFeedbackGroup,
  type FeedbackCategory,
  type FeedbackGroupResponse,
} from '../services/feedbackGroups';
import FeedbackGroupCard from '../components/FeedbackGroupCard';
import FeedbackGroupDetailModal from '../components/FeedbackGroupDetailModal';

const CATEGORY_VALUES: (FeedbackCategory | 'ALL')[] = ['ALL', 'BUG', 'SUGGESTION', 'COMPLAINT', 'PRAISE'];

export default function ArchivePage() {
  const { t } = useTranslation();
  const { canalId: slug } = useParams<{ canalId: string }>();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const { data: archivedGroups, isLoading } = useQuery({
    queryKey: ['feedback-groups', slug, 'ARCHIVED'],
    queryFn: () => getFeedbackGroups(slug!, 'ARCHIVED'),
    enabled: !!slug,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreFeedbackGroup(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['feedback-groups', slug, 'ARCHIVED'] });
      const previous = queryClient.getQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug, 'ARCHIVED']);
      queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug, 'ARCHIVED'], (old) =>
        old?.filter((g) => g.id !== id) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['feedback-groups', slug, 'ARCHIVED'], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-groups', slug] });
    },
  });

  const filtered =
    activeCategory === 'ALL'
      ? archivedGroups
      : archivedGroups?.filter((g) => g.category === activeCategory);

  const maxVotes = archivedGroups
    ? Math.max(0, ...archivedGroups.map((g) => g.voteCount))
    : 0;

  const selectedGroup = archivedGroups?.find((g) => g.id === selectedGroupId) ?? null;

  return (
    <div>
      <div className="mb-6">
        <Link
          to={`/dashboard/${slug}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('archive.backToBoard')}
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{t('archive.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('archive.subtitle')}
        </p>
      </div>

      {/* Category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
              activeCategory === value
                ? 'bg-foreground text-background'
                : 'bg-warm-100 text-muted-foreground hover:bg-warm-200 dark:bg-warm-800 dark:hover:bg-warm-700'
            }`}
          >
            {t(`canal.categories.${value}`)}
            {value !== 'ALL' && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeCategory === value ? 'bg-white/20' : 'bg-warm-200 dark:bg-warm-700'
              }`}>
                {archivedGroups?.filter((g) => g.category === value).length ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-warm-300 p-12 text-center dark:border-warm-700">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {t('archive.empty.title')}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('archive.empty.description')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <div key={group.id} className="group relative">
              <FeedbackGroupCard
                group={group}
                onClick={() => setSelectedGroupId(group.id)}
                compact
                maxVotes={maxVotes}
                onRestore={() => restoreMutation.mutate(group.id)}
              />
            </div>
          ))}
        </div>
      )}

      <FeedbackGroupDetailModal
        group={selectedGroup}
        slug={slug!}
        onClose={() => setSelectedGroupId(null)}
        onStatusChange={() => {}}
        onCategoryChange={() => {}}
        maxVotes={maxVotes}
      />
    </div>
  );
}
