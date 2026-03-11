import api from './api';

export interface CommentResponse {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getComments(
  suggestionId: string,
): Promise<CommentResponse[]> {
  const { data } = await api.get<ApiResult<CommentResponse[]>>(
    `/suggestions/${suggestionId}/comments`,
  );
  return data.data;
}

export async function addComment(
  suggestionId: string,
  content: string,
): Promise<CommentResponse> {
  const { data } = await api.post<ApiResult<CommentResponse>>(
    `/suggestions/${suggestionId}/comments`,
    { content },
  );
  return data.data;
}
