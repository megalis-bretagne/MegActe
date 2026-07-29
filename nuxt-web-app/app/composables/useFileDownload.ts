export function useFileDownload() {
    const config = useRuntimeConfig();
    const { data: user } = useAuth();

    async function downloadDocumentFile(
        entiteId: number,
        idD: string,
        elementId: string,
        filename: string,
        index?: number,
    ) {
        const url = `/entite/${entiteId}/document/${idD}/file/${elementId}/${encodeURIComponent(filename)}`;
        const params = index !== undefined ? { index } : undefined;

        const fetchBlob = (token: string) =>
            $fetch<Blob>(url, {
                baseURL: config.public.apiBaseUrl,
                headers: { Authorization: `Bearer ${token}` },
                query: params,
                responseType: "blob",
            });

        let blob: Blob;
        try {
            blob = await fetchBlob(user.value?.accessToken!);
        } catch (e: any) {
            if (e?.status !== 403) throw e;
            const newToken = await tryRefreshToken();
            if (!newToken) throw e;
            blob = await fetchBlob(newToken);
        }

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
    }

    return { downloadDocumentFile };
}
