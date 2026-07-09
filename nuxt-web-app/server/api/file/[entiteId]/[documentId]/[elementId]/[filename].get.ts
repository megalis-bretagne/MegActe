import { getToken } from "#auth";

export default eventHandler(async (event) => {
  const token = await getToken({ event });
  if (!token?.accessToken) {
    throw createError({ statusCode: 401, message: "Non authentifié" });
  }

  const { entiteId, documentId, elementId, filename } = getRouterParams(event);
  const config = useRuntimeConfig();

  const upstream = await fetch(
    `${config.public.apiBaseUrl}/entite/${entiteId}/document/${documentId}/file/${elementId}/${filename}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } },
  );

  if (!upstream.ok) {
    throw createError({
      statusCode: upstream.status,
      message: "Erreur fichier",
    });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentDisposition =
    upstream.headers.get("content-disposition") ??
    `attachment; filename="${filename}"`;

  setHeader(event, "content-type", contentType);
  setHeader(event, "content-disposition", contentDisposition);

  return sendStream(event, upstream.body!);
});
