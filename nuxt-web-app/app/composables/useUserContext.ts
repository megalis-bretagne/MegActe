import { ref } from "vue";

const user = ref<any>(null);
const pastellReady = ref(false);
const selectedFlux = ref<string | null>(null);

export const useUserContext = () => {
  const initUserFromAuth = async () => {
    try {
      // Appel unique via getSession plutôt que useAuth() qui crée des watchers réactifs
      const session = await $fetch<any>("/auth/session");
      if (session?.user && session?.accessToken) {
        user.value = { ...session.user, token: session.accessToken };
      }
    } catch (error) {
      console.error("Failed to initialize user from auth:", error);
    }
  };

  const initPastellUser = async () => {
    if (pastellReady.value) return;

    try {
      const config = useRuntimeConfig();
      const pastellUser = await $fetch("/user", {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.token}` },
      });
      user.value = { ...user.value, pastell: pastellUser };
      pastellReady.value = true;
    } catch (error) {
      console.error("Failed to fetch related Pastell user data:", error);
    }
  };

  return {
    user,
    pastellReady,
    initUserFromAuth,
    initPastellUser,
    selectedFlux,
  };
};
