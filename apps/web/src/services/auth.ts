import api from './api';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  plano: string;
  avatar?: string;
  memberRole: 'OWNER' | 'MEMBER';
  workspaceName: string;
  ownPlano: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  inviteToken?: string,
): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/register', {
    name,
    email,
    password,
    ...(inviteToken ? { inviteToken } : {}),
  });
  return data.data;
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/google', {
    idToken,
  });
  return data.data;
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/reset-password', { email, code, newPassword });
}
