import { env } from "../config/env";

export type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "request-failed") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const joinUrl = (base: string, path: string) => {
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init?.headers || {});

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(joinUrl(env.apiBase, path), {
    ...init,
    headers,
  });

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(payload?.message || "request-failed", response.status, payload?.code || "request-failed");
  }

  return payload as ApiEnvelope<T>;
}
