import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session?.accessToken) throw createError({ statusCode: 401 });

  const config = useRuntimeConfig();
  const data = await $fetch("/user", {
    baseURL: config.public.apiBaseUrl,
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  return data;
});
