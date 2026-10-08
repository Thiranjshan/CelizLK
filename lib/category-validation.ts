export function normalizeCategoryImageUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;

  const imageUrl = value.trim();
  if (!imageUrl) return null;
  if (imageUrl.length > 1000) return undefined;
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) return imageUrl;

  try {
    const url = new URL(imageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? imageUrl : undefined;
  } catch {
    return undefined;
  }
}
