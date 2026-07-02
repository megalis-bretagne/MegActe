export const postDocumentAction = async (
  entiteId: number,
  documentId: string,
  action: string,
  token: string
): Promise<ActionResult> => {
  try {
    const config = useRuntimeConfig();
    const result: ActionResult = await $fetch(
      `/entite/${entiteId}/documents/perform_action`,
      {
        method: "POST",
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { document_ids: documentId, action: action },
        timeout: 1000,
      }
    );
    return result;
  } catch (e: ActionError) {
    console.error(
      "[ActionError] status:",
      e?.status,
      "| data:",
      e?.data,
      "| message:",
      e?.message
    );
    throw e;
  }
};
