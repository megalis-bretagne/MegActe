import { getServerSession } from "#auth";

export default defineEventHandler(async (event) => {
  // Get the server-side session provided by @sidebase/nuxt-auth
  const session = await getServerSession(event);
  if (!session?.accessToken) throw createError({ statusCode: 401 });

  const config = useRuntimeConfig();
  const data = await $fetch<pastellUser>("/user", {
    baseURL: config.public.apiBaseUrl,
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });

  return data;
});
