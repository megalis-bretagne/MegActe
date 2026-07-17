export default defineNuxtRouteMiddleware(async () => {
  const user = usePastellUser();
  const entityId = useSelectedEntiteId();
  const flux = useSelectedFlux();

  // Skip if already initialized (prevents duplicate fetches on client-side navigation)
  if (!user.value) {
    try {
      const { data, error } = await useFetch('/api/user');

      if (error.value) {
        console.error('Failed to fetch user:', error.value);
        // Optional: redirect to login if auth is required
        // return navigateTo('/login');
      }

      if (data.value) {
        user.value = data.value;
        entityId.value = data.value.user_info?.id_e ?? null;
        // Initialize flux from user data if applicable
        flux.value = data.value.user_info?.default_flux ?? data.value.user_info?.flux ?? null;
      }
    } catch (e) {
      console.error('Middleware init error:', e);
    }
  }
});
