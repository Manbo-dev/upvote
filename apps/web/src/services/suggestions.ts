import api from './api';

export type SuggestionStatus =
  | 'OPEN'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CLOSED';

export interface SuggestionResponse {
  id: string;
  title: string;
  description: string;
  status: SuggestionStatus;
  voteCount: number;
  authorName: string;
  createdAt: string;
  votedByCurrentUser: boolean;
}

export interface VoteResponse {
  voted: boolean;
  voteCount: number;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getSuggestions(
  slug: string,
): Promise<SuggestionResponse[]> {
  const { data } = await api.get<ApiResult<SuggestionResponse[]>>(
    `/products/${slug}/suggestions`,
  );
  return data.data;
}

export async function createSuggestion(
  slug: string,
  request: { title: string; description: string },
): Promise<SuggestionResponse> {
  const { data } = await api.post<ApiResult<SuggestionResponse>>(
    `/products/${slug}/suggestions`,
    request,
  );
  return data.data;
}

export async function voteSuggestion(id: string): Promise<VoteResponse> {
  const { data } = await api.post<ApiResult<VoteResponse>>(
    `/suggestions/${id}/vote`,
  );
  return data.data;
}

export async function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
): Promise<SuggestionResponse> {
  const { data } = await api.patch<ApiResult<SuggestionResponse>>(
    `/suggestions/${id}/status`,
    { status },
  );
  return data.data;
}
