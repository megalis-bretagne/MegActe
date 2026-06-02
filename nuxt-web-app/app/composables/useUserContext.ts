import { ref, computed } from "vue";

// Reactive object for authenticated user
const user = ref<any>(null);

export const useUserContext = () => {
  // Vérifie si l'utilisateur est super admin
  // const isSuperAdmin = computed(() => {
  //   return currentUser.value?.user_info?.id_e === 0
  // })
  //
  // // Retourne l'entité de base si l'utilisateur n'est pas super admin
  // const entiteBase = computed(() => {
  //   if (isSuperAdmin.value) {
  //     return null
  //   }
  //   return currentUser.value?.entite || null
  // })
  //
  // Get user information from oidc session data
  const initUserFromAuth = async () => {
    try {
      const { data, status } = useAuth();

      console.log("[auth] data brut:", JSON.stringify(data.value));

      if (status.value === "authenticated" && data.value) {
        console.log("user is authenticated");
        user.value = { ...data.value?.user, token: data.value?.accessToken };
        console.log(user.value);
        console.log("user name = ", user.value?.name);
      }
    } catch (error) {
      console.error("Failed to initialize user from auth:", error);
    }
  };

  //Get related pastell user from backend
  const initPastellUser = async () => {
    try {
      const config = useRuntimeConfig();
      console.log("initPastellUser: token:" + user.value?.token);
      const pastellUser = await $fetch("/user", {
        baseURL: config.public.apiBaseUrl,
        headers: {
          Authorization: `Bearer ${user.value?.token}`,
        },
      });
      user.value = { ...user.value, pastell: pastellUser };
    } catch (error) {
      console.error("Failed to fetch related Pastell user data:", error);
    }
  };

  return {
    user,
    //isSuperAdmin,
    //entiteBase,
    initUserFromAuth,
    initPastellUser,
  };
};
