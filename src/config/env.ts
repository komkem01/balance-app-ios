const FALLBACK_API_BASE = "http://localhost:8080/api/v1";

const rawApiBase = process.env.EXPO_PUBLIC_BASE_URL?.trim();

export const env = {
  apiBase: rawApiBase && rawApiBase.length > 0 ? rawApiBase : FALLBACK_API_BASE,
} as const;

export type AppEnv = typeof env;
