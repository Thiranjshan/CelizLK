// Centralized environment validation keeps production secrets explicit and prevents
// silent fallbacks that would otherwise allow a deploy to boot with insecure defaults.

export function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];

  if (value && value.trim() !== '') {
    return value.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return fallback ?? '';
}
