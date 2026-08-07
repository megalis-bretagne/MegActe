export function useFileDownload() {
    const apiFetch = useApiFetch();

    async function downloadDocumentFile(
        entiteId: number,
        idD: string,
        elementId: string,
        filename: string,
        index?: number,
    ) {
        const url = `/entite/${entiteId}/document/${idD}/file/${elementId}/${encodeURIComponent(filename)}`;
        const query = index !== undefined ? { index } : undefined;

        const blob = await apiFetch<Blob>(url, { query, responseType: "blob" });

        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");

        console.log(a)
        a.href = objectUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(objectUrl);
    }

    return { downloadDocumentFile };
}
