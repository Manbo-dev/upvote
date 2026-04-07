import api from './api';
import type { AuthResponse } from './auth';

export interface TeamMember {
  id: string;
  invitedEmail: string;
  memberName: string | null;
  memberAvatar: string | null;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
  invitedAt: string;
  acceptedAt: string | null;
}

export interface InvitePreviewResponse {
  ownerName: string | null;
  ownerAvatar: string | null;
  invitedEmail: string | null;
  expired: boolean;
  alreadyAccepted: boolean;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function inviteMember(email: string): Promise<TeamMember> {
  const { data } = await api.post<ApiResult<TeamMember>>('/team/invite', { email });
  return data.data;
}

export async function listMembers(): Promise<TeamMember[]> {
  const { data } = await api.get<ApiResult<TeamMember[]>>('/team/members');
  return data.data;
}

export async function removeMember(id: string): Promise<void> {
  await api.delete(`/team/members/${id}`);
}

export async function acceptInvite(token: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/team/accept', { token });
  return data.data;
}

export async function getInvitePreview(token: string): Promise<InvitePreviewResponse> {
  const { data } = await api.get<ApiResult<InvitePreviewResponse>>(`/team/invite/${token}`);
  return data.data;
}
