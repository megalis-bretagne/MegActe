const user = ref<userSession>(null);
const pastellReady = ref(false);
const selectedFlux = ref<string | null>(null);

//const { logger } = useAppLogger();
// Reactive object for authenticated user

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

        console.log("user is authenticated");
        console.log("user name = ", user.value?.name);
        console.log("acces token = ", user.value?.token);
        console.log("user object: ");
        console.log(user.value);
      }
    } catch (error) {
      console.log("Failed to initialize user from auth:", error);
    }
  };

  return {
    user,
    pastellReady,
    initUserFromAuth,
  };
};
