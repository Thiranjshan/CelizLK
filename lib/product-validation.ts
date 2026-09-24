export const PRODUCT_NAME_MAX_LENGTH = 160;
export const PRODUCT_SLUG_MAX_LENGTH = 160;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 5000;
export const PRODUCT_SPECS_MAX_LENGTH = 10000;

const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeProductSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, PRODUCT_SLUG_MAX_LENGTH);
}

export function isValidProductSlug(value: string) {
  return value.length > 0 && value.length <= PRODUCT_SLUG_MAX_LENGTH && PRODUCT_SLUG_PATTERN.test(value);
}

export function normalizeProductImages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (image): image is string =>
        typeof image === 'string' &&
        image.trim().length > 0 &&
        (/^https?:\/\//.test(image) || (image.startsWith('/') && !image.startsWith('//'))),
    )
    .slice(0, 12);
}