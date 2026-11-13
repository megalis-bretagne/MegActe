// Priorité : `data.detail` de l'API, puis message générique, puis fallback de l'appelant.
export function getErrorDetail(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const data = err.data as Record<string, unknown> | undefined;
    if (data && typeof data.detail === "string") {
      return data.detail;
    }
    if (typeof err.message === "string") {
      return err.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}
