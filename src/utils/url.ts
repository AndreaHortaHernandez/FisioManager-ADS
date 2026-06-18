const BACKEND_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api').replace('/api', '');

export function resolveUploadUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}
