import api from './api';
import type { SuggestionStatus } from './suggestions';

// Resposta de um grupo de feedbacks agrupados pela IA
export interface FeedbackGroupResponse {
  id: string;
  title: string;
  summary: string;
  voteCount: number;
  status: SuggestionStatus;
  topContext: string; // ex: "apos 'botao Pagar' na tela de checkout"
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

// Busca os grupos de feedback de um produto, opcionalmente filtrados por status
export async function getFeedbackGroups(
  slug: string,
  status?: string,
): Promise<FeedbackGroupResponse[]> {
  const params = status ? { status } : {};
  const { data } = await api.get<ApiResult<FeedbackGroupResponse[]>>(
    `/products/${slug}/feedback-groups`,
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

// Atualiza o status de um grupo de feedback
export async function updateFeedbackGroupStatus(
  groupId: string,
  status: SuggestionStatus,
): Promise<FeedbackGroupResponse> {
  const { data } = await api.patch<ApiResult<FeedbackGroupResponse>>(
    `/feedback-groups/${groupId}/status`,
    { status },
  );
  return data.data;
}
