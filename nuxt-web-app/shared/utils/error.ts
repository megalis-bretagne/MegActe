
export interface ApiError {
    message: string;
    statusCode?: number;
    data?: unknown;
}

/**
 * Utilitaire pour transformer un 'unknown' de bloc catch en une ApiError typée
 */
export function useApiError(error: unknown): ApiError {
    // Si c'est déjà un objet avec un message (cas le plus fréquent)
    if (error && typeof error === 'object' && 'message' in error) {
        const err = error as Record<string, unknown>;
        return {
            message: String(err.message),
            statusCode: (err.statusCode ?? err.status) as number | undefined,
            data: err.data
        };
    }

    // Si l'erreur est une simple chaîne de caractères
    if (typeof error === 'string') {
        return { message: error };
    }

    // Cas de secours par défaut
    return { message: "Une erreur inconnue est survenue." };
}

/**
 * Extrait un message d'erreur lisible depuis un 'unknown' de bloc catch :
 * priorité au 'detail' renvoyé par l'API, puis au message d'erreur générique,
 * puis au fallback fourni par l'appelant.
 */
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