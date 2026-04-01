import api from './api';

export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  plano: string;
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

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/google', {
    idToken,
  });
  return data.data;
}

export async function appleLogin(idToken: string, name?: string): Promise<AuthResponse> {
  const { data } = await api.post<ApiResult<AuthResponse>>('/auth/apple', {
    idToken,
    name,
  });
  return data.data;
}
