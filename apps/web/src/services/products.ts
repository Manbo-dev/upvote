import api from './api';

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  widgetColor: string;
  createdAt: string;
}

interface ApiResult<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function getProducts(): Promise<ProductResponse[]> {
  const { data } = await api.get<ApiResult<ProductResponse[]>>('/products');
  return data.data;
}

export async function createProduct(request: {
  name: string;
  slug: string;
}): Promise<ProductResponse> {
  const { data } = await api.post<ApiResult<ProductResponse>>(
    '/products',
    request,
  );
  return data.data;
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductResponse> {
  const { data } = await api.get<ApiResult<ProductResponse>>(
    `/products/${slug}`,
  );
  return data.data;
}
