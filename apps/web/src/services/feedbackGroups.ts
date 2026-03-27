import api from './api';

export type FeedbackGroupStatus = 'OPEN' | 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CLOSED' | 'ARCHIVED';

// Resposta de um grupo de feedbacks agrupados pela IA
export type FeedbackCategory = 'BUG' | 'SUGGESTION' | 'COMPLAINT' | 'PRAISE';

export interface ExternalIssueInfo {
  id: string;
  provider: 'JIRA' | 'CLICKUP';
  externalId: string;
  externalUrl: string;
  externalStatus: string;
}

export interface FeedbackGroupResponse {
  id: string;
  title: string;
  summary: string;
  voteCount: number;
  status: FeedbackGroupStatus;
  category: FeedbackCategory;
  topContext: string; // ex: "apos 'botao Pagar' na tela de checkout"
  externalIssues?: ExternalIssueInfo[];
  createdAt: string;
  updatedAt: string;
}

// Detalhe de um feedback individual dentro de um grupo
export interface FeedbackDetail {
  id: string;
  rawMessage: string;
  synthesizedMessage: string;
  pageUrl: string;
  pageTitle: string;
  triggerType: string;
  lastInteraction: string;
  deviceType: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Busca os grupos de feedback de um canal, opcionalmente filtrados por status
export async function getFeedbackGroups(
  slug: string,
  status?: string,
  category?: string,
): Promise<FeedbackGroupResponse[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (category) params.category = category;
  const { data } = await api.get<ApiResult<FeedbackGroupResponse[]>>(
    `/canais/${slug}/feedback-groups`,
    { params },
  );
  return data.data;
}

// Busca os feedbacks individuais que compõem um grupo
export async function getFeedbackGroupDetails(
  groupId: string,
): Promise<FeedbackDetail[]> {
  const { data } = await api.get<ApiResult<FeedbackDetail[]>>(
    `/feedback-groups/${groupId}/feedbacks`,
  );
  return data.data;
}

// Atualiza a categoria de um grupo de feedback
export async function updateFeedbackGroupCategory(
  groupId: string,
  category: FeedbackCategory,
): Promise<FeedbackGroupResponse> {
  const { data } = await api.patch<ApiResult<FeedbackGroupResponse>>(
    `/feedback-groups/${groupId}/category`,
    { category },
  );
  return data.data;
}

// Atualiza o status de um grupo de feedback
export async function updateFeedbackGroupStatus(
  groupId: string,
  status: FeedbackGroupStatus,
): Promise<FeedbackGroupResponse> {
  const { data } = await api.patch<ApiResult<FeedbackGroupResponse>>(
    `/feedback-groups/${groupId}/status`,
    { status },
  );
  return data.data;
}

// Archives all DONE feedback groups for a channel
export async function archiveAllDone(
  slug: string,
): Promise<{ archivedCount: number }> {
  const { data } = await api.post<ApiResult<{ archivedCount: number }>>(
    `/canais/${slug}/feedback-groups/archive-done`,
  );
  return data.data;
}

// Archives a single feedback group
export async function archiveFeedbackGroup(
  groupId: string,
): Promise<FeedbackGroupResponse> {
  const { data } = await api.post<ApiResult<FeedbackGroupResponse>>(
    `/feedback-groups/${groupId}/archive`,
  );
  return data.data;
}

// Restores an archived feedback group back to DONE
export async function restoreFeedbackGroup(
  groupId: string,
): Promise<FeedbackGroupResponse> {
  const { data } = await api.post<ApiResult<FeedbackGroupResponse>>(
    `/feedback-groups/${groupId}/restore`,
  );
  return data.data;
}

// Downloads a CSV report of feedback groups with optional filters
export async function exportFeedbackGroups(
  slug: string,
  options: {
    status?: string;
    category?: string;
    from?: string;
    to?: string;
    includeDetails?: boolean;
  },
): Promise<void> {
  const params = new URLSearchParams();
  if (options.status && options.status !== 'ALL') params.set('status', options.status);
  if (options.category && options.category !== 'ALL') params.set('category', options.category);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.includeDetails) params.set('includeDetails', 'true');

  const token = localStorage.getItem('token');
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const query = params.toString();
  const url = `${baseUrl}/api/canais/${slug}/report.csv${query ? '?' + query : ''}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });

  if (!response.ok) {
    throw new Error('Failed to export report');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `feedback-${slug}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

// Downloads a PDF report of feedback groups with optional filters
export async function exportFeedbackGroupsPdf(
  slug: string,
  options: {
    status?: string;
    category?: string;
    from?: string;
    to?: string;
  },
): Promise<void> {
  const params = new URLSearchParams();
  if (options.status && options.status !== 'ALL') params.set('status', options.status);
  if (options.category && options.category !== 'ALL') params.set('category', options.category);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);

  const token = localStorage.getItem('token');
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  const query = params.toString();
  const url = `${baseUrl}/api/canais/${slug}/report.pdf${query ? '?' + query : ''}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });

  if (!response.ok) {
    throw new Error('Failed to export PDF report');
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `feedback-${slug}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
