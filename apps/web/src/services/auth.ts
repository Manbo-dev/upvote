import api from './api';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
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
): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/register', {
    name,
    email,
    password,
  });
  return data.data;
}
