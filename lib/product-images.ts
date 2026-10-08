export function parseProductImages(images: string): string[] {
  try {
    const parsed: unknown = JSON.parse(images);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((image): image is string => typeof image === 'string');
  } catch {
    return [];
  }
}
