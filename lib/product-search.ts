export function normalizeProductSearchQuery(value: string | null): string {
  return (value ?? '').trim().slice(0, 60);
}

export function escapeLikeWildcards(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export function getFirstProductImage(images: string): string | null {
  try {
    const parsed: unknown = JSON.parse(images);
    if (!Array.isArray(parsed) || typeof parsed[0] !== 'string') return null;
    return parsed[0];
  } catch {
    return null;
  }
}
