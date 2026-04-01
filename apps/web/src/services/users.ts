import api from './api';

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface UserProfileResponse {
  name: string;
  email: string;
  avatar?: string;
  plano: string;
}

export async function getProfile(): Promise<UserProfileResponse> {
  const { data } = await api.get<ApiResult<UserProfileResponse>>('/users/me');
  return data.data;
}

export async function updateProfile(profile: {
  name?: string;
  avatar?: string;
}): Promise<UserProfileResponse> {
  const { data } = await api.put<ApiResult<UserProfileResponse>>(
    '/users/me',
    profile,
  );
  return data.data;
}

export async function requestPasswordChange(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/users/me/request-password-change', {
    currentPassword,
    newPassword,
  });
}

export async function confirmPasswordChange(code: string): Promise<void> {
  await api.post('/users/me/confirm-password-change', { code });
}
