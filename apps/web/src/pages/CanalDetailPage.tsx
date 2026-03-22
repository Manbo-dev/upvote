import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  getFeedbackGroups,
  updateFeedbackGroupStatus,
  updateFeedbackGroupCategory,
  archiveAllDone,
  archiveFeedbackGroup,
  exportFeedbackGroups,
  type FeedbackCategory,
  type FeedbackGroupResponse,
  type FeedbackGroupStatus,
} from '../services/feedbackGroups';
import FeedbackGroupCard from '../components/FeedbackGroupCard';
import FeedbackGroupDetailModal from '../components/FeedbackGroupDetailModal';
import KanbanColumn from '../components/KanbanColumn';

const CATEGORY_FILTERS: {
  label: string;
  value: FeedbackCategory | 'ALL';
  icon: React.ReactNode;
  activeClasses: string;
  dropClasses: string;
}[] = [
  {
    label: 'All',
    value: 'ALL',
    icon: null,
    activeClasses: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
    dropClasses: '',
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
    dropClasses: 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20 dark:ring-red-500',
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
    dropClasses: 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:ring-blue-500',
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
    dropClasses: 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/20 dark:ring-orange-500',
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
    dropClasses: 'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20 dark:ring-green-500',
  },
];

const KANBAN_COLUMNS: {
  status: FeedbackGroupStatus;
  title: string;
  color: string;
}[] = [
  { status: 'OPEN', title: 'Open', color: 'bg-blue-500' },
  { status: 'PLANNED', title: 'Planned', color: 'bg-yellow-500' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-orange-500' },
  { status: 'DONE', title: 'Done', color: 'bg-green-500' },
];

// Drop ID prefix to distinguish category drops from status drops
const CAT_DROP_PREFIX = 'cat:';

type DatePreset = 'ALL' | 'TODAY' | 'LAST_7' | 'LAST_30' | 'THIS_MONTH' | 'CUSTOM';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'ALL', label: 'All time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'LAST_7', label: 'Last 7 days' },
  { value: 'LAST_30', label: 'Last 30 days' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'CUSTOM', label: 'Custom range' },
];

function getDateRange(preset: DatePreset): { from: Date | null; to: Date | null } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);
  switch (preset) {
    case 'TODAY':
      return { from: startOfDay, to: endOfDay };
    case 'LAST_7': {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 6);
      return { from, to: endOfDay };
    }
    case 'LAST_30': {
      const from = new Date(startOfDay);
      from.setDate(from.getDate() - 29);
      return { from, to: endOfDay };
    }
    case 'THIS_MONTH':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay };
    default:
      return { from: null, to: null };
  }
}

interface DroppableCategoryPillProps {
  filter: (typeof CATEGORY_FILTERS)[number];
  isActive: boolean;
  isDragging: boolean;
  count: number;
  onClick: () => void;
}

function DroppableCategoryPill({
  filter,
  isActive,
  isDragging,
  count,
  onClick,
}: DroppableCategoryPillProps) {
  const droppableId = filter.value === 'ALL' ? 'cat:ALL' : `${CAT_DROP_PREFIX}${filter.value}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    disabled: filter.value === 'ALL',
  });

  const isDroppable = filter.value !== 'ALL';
  const isOvering = isOver && isDroppable;

  // Zona grande durante drag (exceto "All")
  if (isDragging && isDroppable) {
    return (
      <div
        ref={setNodeRef}
        className={`
          flex flex-1 cursor-default flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 transition-all duration-150
          ${isOvering ? 'scale-105 border-solid shadow-md ' + filter.dropClasses : 'border-gray-200 dark:border-gray-700'}
        `}
      >
        <span className={`${isOvering ? 'opacity-100' : 'opacity-40'} transition-opacity`}>
          {filter.icon}
        </span>
        <span className={`text-xs font-semibold ${isOvering ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
          {filter.label}
        </span>
      </div>
    );
  }

  // Pill normal
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150
        ${isActive ? filter.activeClasses : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}
      `}
    >
      {filter.icon}
      {filter.label}
      {isDroppable && (
        <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs ${isActive ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export default function CanalDetailPage() {
  const { canalId: slug } = useParams<{ canalId: string }>();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [draggingGroup, setDraggingGroup] = useState<FeedbackGroupResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportStatus, setExportStatus] = useState<FeedbackGroupStatus | 'ALL'>('ALL');
  const [exportIncludeDetails, setExportIncludeDetails] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    }
    if (dateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dateDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exportOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const { data: feedbackGroups, isLoading } = useQuery({
    queryKey: ['feedback-groups', slug],
    queryFn: () => getFeedbackGroups(slug!),
    enabled: !!slug,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackGroupStatus }) =>
      updateFeedbackGroupStatus(id, status),
    onMutate: async ({ id, status }) => {
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

  const archiveAllMutation = useMutation({
    mutationFn: () => archiveAllDone(slug!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feedback-groups', slug] });
      const previous = queryClient.getQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug]);
      queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
        old?.filter((g) => g.status !== 'DONE') ?? [],
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

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveFeedbackGroup(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['feedback-groups', slug] });
      const previous = queryClient.getQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug]);
      queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
        old?.filter((g) => g.id !== id) ?? [],
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

  const dateRange = datePreset === 'CUSTOM'
    ? {
        from: customFrom ? new Date(customFrom + 'T00:00:00') : null,
        to: customTo ? new Date(customTo + 'T23:59:59') : null,
      }
    : getDateRange(datePreset);

  const activeDateLabel = DATE_PRESETS.find((p) => p.value === datePreset)?.label ?? 'All time';

  const filtered = feedbackGroups?.filter((g) => {
    const matchesCategory = activeCategory === 'ALL' || g.category === activeCategory;
    if (!matchesCategory) return false;
    if (datePreset !== 'ALL') {
      const created = new Date(g.createdAt);
      if (dateRange.from && created < dateRange.from) return false;
      if (dateRange.to && created > dateRange.to) return false;
    }
    if (!debouncedQuery.trim()) return true;
    const q = debouncedQuery.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.summary?.toLowerCase().includes(q) ||
      g.topContext?.toLowerCase().includes(q)
    );
  });

  // Derive selectedGroup from live cache so modal reflects optimistic updates
  const selectedGroup = feedbackGroups?.find((g) => g.id === selectedGroupId) ?? null;

  const maxVotes = feedbackGroups
    ? Math.max(0, ...feedbackGroups.map((g) => g.voteCount))
    : 0;

  const groupsByStatus = (status: FeedbackGroupStatus) =>
    filtered?.filter((g) => g.status === status) ?? [];

  function handleDragStart(event: DragStartEvent) {
    const group = feedbackGroups?.find((g) => g.id === event.active.id);
    setDraggingGroup(group ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) {
      const overId = over.id as string;
      const group = feedbackGroups?.find((g) => g.id === active.id);

      if (group) {
        if (overId.startsWith(CAT_DROP_PREFIX)) {
          const rawCategory = overId.replace(CAT_DROP_PREFIX, '');
          if (rawCategory !== 'ALL' && group.category !== rawCategory) {
            const newCategory = rawCategory as FeedbackCategory;
            // Sync optimistic update before clearing drag state to avoid visual snap-back
            queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
              old?.map((g) => (g.id === group.id ? { ...g, category: newCategory } : g)) ?? [],
            );
            categoryMutation.mutate({ id: group.id, category: newCategory });
          }
        } else {
          const newStatus = overId as FeedbackGroupStatus;
          if (group.status !== newStatus) {
            // Sync optimistic update before clearing drag state to avoid visual snap-back
            queryClient.setQueryData<FeedbackGroupResponse[]>(['feedback-groups', slug], (old) =>
              old?.map((g) => (g.id === group.id ? { ...g, status: newStatus } : g)) ?? [],
            );
            statusMutation.mutate({ id: group.id, status: newStatus });
          }
        }
      }
    }

    // Clear drag state after cache is already updated so overlay removal shows the card in its new position
    setDraggingGroup(null);
  }

  function toDateParam(d: Date | null): string | undefined {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportFeedbackGroups(slug!, {
        status: exportStatus !== 'ALL' ? exportStatus : undefined,
        category: activeCategory !== 'ALL' ? activeCategory : undefined,
        from: toDateParam(dateRange.from),
        to: toDateParam(dateRange.to),
        includeDetails: exportIncludeDetails,
      });
      setExportOpen(false);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedbacks</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Feedbacks capturados pelo widget sao agrupados automaticamente pela IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export CSV button + dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            {exportOpen && (
              <div className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Export report</p>

                {/* Format selector */}
                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Format</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExportFormat('csv')}
                      className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        exportFormat === 'csv'
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      CSV
                    </button>
                    <button
                      disabled
                      className="flex-1 cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-400 dark:border-gray-700 dark:text-gray-600"
                      title="Coming soon"
                    >
                      PDF
                      <span className="ml-1 text-[10px] opacity-60">soon</span>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                  <select
                    value={exportStatus}
                    onChange={(e) => setExportStatus(e.target.value as FeedbackGroupStatus | 'ALL')}
                    className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <label className="mb-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportIncludeDetails}
                    onChange={(e) => setExportIncludeDetails(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include individual feedbacks</span>
                </label>

                {(activeCategory !== 'ALL' || datePreset !== 'ALL') && (
                  <p className="mb-3 rounded-md bg-gray-50 px-2 py-1.5 text-xs text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    Active filters applied:{' '}
                    {activeCategory !== 'ALL' && <span className="font-medium">{activeCategory.toLowerCase()}</span>}
                    {activeCategory !== 'ALL' && datePreset !== 'ALL' && ' · '}
                    {datePreset !== 'ALL' && <span className="font-medium">{activeDateLabel.toLowerCase()}</span>}
                  </p>
                )}

                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="w-full rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {exporting ? 'Exporting...' : `Download ${exportFormat.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>

          <Link
            to={`/dashboard/${slug}/arquivo`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </Link>
        </div>
      </div>

      {/* Search bar + date filter */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Search feedbacks..."
            className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Date range filter */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setDateDropdownOpen((o) => !o)}
            className={`inline-flex h-full items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
              datePreset !== 'ALL'
                ? 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {activeDateLabel}
            <svg className={`h-3 w-3 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dateDropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {DATE_PRESETS.filter((p) => p.value !== 'CUSTOM').map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    setDatePreset(preset.value);
                    if (preset.value !== 'CUSTOM') setDateDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    datePreset === preset.value
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                  {datePreset === preset.value && (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => setDatePreset('CUSTOM')}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  datePreset === 'CUSTOM'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Custom range
                {datePreset === 'CUSTOM' && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              {datePreset === 'CUSTOM' && (
                <div className="space-y-2 px-3 pb-2 pt-1">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">From</label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">To</label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => setDateDropdownOpen(false)}
                    className="w-full rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Category filter pills — expand to drop zones while dragging */}
        <div className={`mb-6 flex gap-3 ${draggingGroup ? '' : 'flex-wrap'}`}>
          {CATEGORY_FILTERS.filter((f) => !draggingGroup || f.value !== 'ALL').map((filter) => (
            <DroppableCategoryPill
              key={filter.value}
              filter={filter}
              isActive={activeCategory === filter.value}
              isDragging={!!draggingGroup}
              count={feedbackGroups?.filter((g) => g.category === filter.value).length ?? 0}
              onClick={() => setActiveCategory(filter.value)}
            />
          ))}
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
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {KANBAN_COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  title={col.title}
                  status={col.status}
                  color={col.color}
                  groups={groupsByStatus(col.status)}
                  onCardClick={(g) => setSelectedGroupId(g.id)}
                  maxVotes={maxVotes}
                  onArchive={(id) => archiveMutation.mutate(id)}
                  headerAction={
                    col.status === 'DONE' && groupsByStatus('DONE').length > 0 ? (
                      <button
                        onClick={() => archiveAllMutation.mutate()}
                        disabled={archiveAllMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                        title="Archive all done feedbacks"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        {archiveAllMutation.isPending ? 'Archiving...' : 'Archive all'}
                      </button>
                    ) : undefined
                  }
                />
              ))}
            </div>

            {filtered?.length === 0 && (
              <div className="col-span-full mt-2 rounded-xl border border-gray-200 p-8 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No feedbacks match
                  {debouncedQuery && <span className="font-medium"> "{debouncedQuery}"</span>}
                  {activeCategory !== 'ALL' && (
                    <span className="font-medium"> in {activeCategory.toLowerCase()}</span>
                  )}
                  {datePreset !== 'ALL' && (
                    <span className="font-medium"> for {activeDateLabel.toLowerCase()}</span>
                  )}
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); setDatePreset('ALL'); }}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Clear filters
                </button>
              </div>
            )}

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
          </>
        )}
      </DndContext>

      <FeedbackGroupDetailModal
        group={selectedGroup}
        slug={slug!}
        onClose={() => setSelectedGroupId(null)}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
        onCategoryChange={(id, category) => categoryMutation.mutate({ id, category })}
        maxVotes={maxVotes}
      />
    </div>
  );
}
