// Pas de retry sur 4xx (erreur définitive, pas transitoire)
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const err = error as { status?: number; response?: { status?: number } };
  const status = err?.status ?? err?.response?.status;
  if (status && status >= 400 && status < 500) return false;
  return failureCount < 1;
}
