const user = ref<userSession>(null);
const pastellReady = ref(false);
const selectedFlux = ref<string | null>(null);

export const useUserContext = () => {
  const initUserFromAuth = async () => {
    try {
      const { data, status } = useAuth();

      if (status.value === "authenticated" && data.value) {
        user.value = {
          ...data.value?.user,
          pastellUser: data.value?.pastellUser,
          token: data.value?.accessToken,
        };

        // Synchronise le token à chaque refresh de session nuxt-auth
        watch(
          () => data.value?.accessToken,
          (newToken) => {
            if (newToken && user.value) {
              user.value = { ...user.value, token: newToken };
            }
          },
        );
      }
    } catch (error) {
      console.log("Failed to initialize user from auth:", error);
    }
  };

  return {
    user,
    pastellReady,
    selectedFlux,
    initUserFromAuth,
  };
};
