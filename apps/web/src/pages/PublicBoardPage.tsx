import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { Badge } from '../components/ui/badge';
import { useThemeStore } from '../store/themeStore';
import { useEffect } from 'react';

interface PublicBoardGroup {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  category: string;
  voteCount: number;
}

interface PublicBoardData {
  canalName: string;
  slug: string;
  groups: PublicBoardGroup[];
}

interface ApiResult<T> {
  success: boolean;
  data: T;
}

async function fetchPublicBoard(slug: string): Promise<PublicBoardData> {
  const { data } = await api.get<ApiResult<PublicBoardData>>(`/public/canais/${slug}/board`);
  return data.data;
}

const STATUS_ORDER = ['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500',
  PLANNED: 'bg-yellow-500',
  IN_PROGRESS: 'bg-orange-500',
  DONE: 'bg-green-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  BUG: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SUGGESTION: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLAINT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  PRAISE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export default function PublicBoardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const apply = useThemeStore((s) => s.apply);

  useEffect(() => {
    apply();
  }, [apply]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-board', slug],
    queryFn: () => fetchPublicBoard(slug!),
    retry: false,
  });

  const groupsByStatus: Record<string, PublicBoardGroup[]> = {};
  if (data) {
    for (const status of STATUS_ORDER) {
      groupsByStatus[status] = data.groups.filter((g) => g.status === status);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          {isLoading ? (
            <div className="h-7 w-48 animate-pulse rounded bg-warm-200 dark:bg-warm-700" />
          ) : isError ? null : (
            <div>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {data?.canalName}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('publicBoard.subtitle')}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_ORDER.map((s) => (
              <div key={s} className="space-y-3">
                <div className="h-5 w-24 animate-pulse rounded bg-warm-200 dark:bg-warm-700" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-lg bg-warm-100 dark:bg-warm-800" />
                ))}
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-lg font-medium text-foreground">
              {t('publicBoard.notAvailable')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('publicBoard.notAvailableDescription')}
            </p>
          </div>
        )}

        {data && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_ORDER.map((status) => {
              const items = groupsByStatus[status] ?? [];
              return (
                <div key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status]}`} />
                    <span className="text-sm font-semibold text-foreground">
                      {t(`status.${status}`)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                  </div>

                  <div className="space-y-2.5">
                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                        {t('publicBoard.emptyColumn')}
                      </p>
                    ) : (
                      items.map((group) => (
                        <div
                          key={group.id}
                          className="rounded-lg border border-border bg-card p-3.5 shadow-sm"
                        >
                          <div className="mb-1.5 flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug text-foreground">
                              {group.title}
                            </p>
                            <span className="shrink-0 text-xs font-medium text-muted-foreground">
                              ↑ {group.voteCount}
                            </span>
                          </div>
                          {group.summary && (
                            <p className="mb-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                              {group.summary}
                            </p>
                          )}
                          <Badge
                            className={`text-xs ${CATEGORY_COLORS[group.category] ?? ''}`}
                            variant="outline"
                          >
                            {t(`category.${group.category}`)}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-12 border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground">
          {t('publicBoard.poweredBy')}{' '}
          <a
            href="https://upvote.pro"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Upvote
          </a>
        </p>
      </footer>
    </div>
  );
}
