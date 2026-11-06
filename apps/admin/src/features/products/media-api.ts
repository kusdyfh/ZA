import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '@/lib/api/client';
import { getStoredAuth } from '@/lib/auth/token-storage';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export interface ProductMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
  colorId: string | null;
}

export interface ProductMediaEntry {
  type: 'IMAGE' | 'VIDEO';
  url: string;
  altText?: string;
  isCover: boolean;
  /** The color this image shows; null when shared by every color. */
  colorId: string | null;
}

const QUERY_KEY = 'product-media';

export function useProductMediaQuery(productId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, productId],
    queryFn: () =>
      apiFetch<ProductMedia[]>(`/catalog/products/${productId}/media`, {
        auth: false,
      }),
    enabled: Boolean(productId),
  });
}

export function useSetProductMediaMutation(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (media: ProductMediaEntry[]) =>
      apiFetch<void>(`/catalog/products/${productId}/media`, {
        method: 'PUT',
        body: { media },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, productId] }),
  });
}

/**
 * Uploads one file to the local-disk media store (catalog/media/uploads)
 * and returns its public URL. A plain `fetch` with `FormData`, not
 * `apiFetch` — that helper always JSON-encodes `body`, which would break
 * a multipart upload.
 */
export async function uploadProductMediaFile(file: File): Promise<string> {
  const stored = getStoredAuth();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/catalog/media/uploads`, {
    method: 'POST',
    headers: stored?.accessToken
      ? { Authorization: `Bearer ${stored.accessToken}` }
      : undefined,
    body: formData,
  });

  const json = (await response.json().catch(() => null)) as
    | { success: true; data: { url: string } }
    | { success: false; error: { code: string; message: string } }
    | null;

  if (!json || !json.success) {
    throw new ApiError(
      json?.success === false ? json.error.code : 'UPLOAD_FAILED',
      json?.success === false ? json.error.message : 'Upload failed.',
      response.status,
    );
  }
  return json.data.url;
}

export function useUploadProductMediaFileMutation() {
  return useMutation({ mutationFn: uploadProductMediaFile });
}
