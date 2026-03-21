import api from './api';

export interface CanalResponse {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  widgetColor: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getCanais(): Promise<CanalResponse[]> {
  const { data } = await api.get<ApiResult<CanalResponse[]>>('/canais');
  return data.data;
}

export async function createCanal(request: {
  name: string;
  slug: string;
}): Promise<CanalResponse> {
  const { data } = await api.post<ApiResult<CanalResponse>>(
    '/canais',
    request,
  );
  return data.data;
}

export async function getCanalBySlug(
  slug: string,
): Promise<CanalResponse> {
  const { data } = await api.get<ApiResult<CanalResponse>>(
    `/canais/${slug}`,
  );
  return data.data;
}

export async function renameCanal(id: string, name: string, slug: string): Promise<CanalResponse> {
  const { data } = await api.patch<ApiResult<CanalResponse>>(
    `/canais/${id}/rename`,
    { name, slug },
  );
  return data.data;
}

export async function deleteCanal(id: string): Promise<void> {
  await api.delete(`/canais/${id}`);
}
