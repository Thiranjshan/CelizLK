import { unlink } from 'node:fs/promises';
import path from 'node:path';

export function getRemovedUploadUrls(oldUrls: Array<string | null | undefined>, nextUrls: Array<string | null | undefined>) {
  const previous = new Set((oldUrls ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0));
  const next = new Set((nextUrls ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0));

  return [...previous].filter((url) => !next.has(url));
}

export function getUploadFilePath(url: string | null | undefined) {
  if (typeof url !== 'string') return null;

  const normalized = url.trim().split('?')[0].split('#')[0].replace(/\\/g, '/');
  if (!normalized.startsWith('/uploads/')) return null;

  const relativePath = normalized.replace(/^\/+/, '');
  return path.join(process.cwd(), 'public', relativePath);
}

export async function deleteUploadFileIfExists(url: string | null | undefined) {
  const filePath = getUploadFilePath(url);
  if (!filePath) return false;

  try {
    await unlink(filePath);
    return true;
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'ENOENT' || code === 'ENOTDIR') return false;
    if (code === 'EACCES' || code === 'EPERM') {
      console.warn(`Skipping upload cleanup because file is not deletable: ${filePath}`);
      return false;
    }
    throw error;
  }
}
