//const { logger } = useAppLogger();
// Reactive object for authenticated user
const user = ref<userSession>(null);

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

      if (status.value === "authenticated" && data.value) {
        user.value = {
          ...data.value?.user,
          pastellUser: data.value?.pastellUser
        };
        console.log("user is authenticated");
        console.log("user name = ", user.value?.name);
        console.log("user object: ");
        console.log(user.value);
      }
    } catch (error) {
      console.log("Failed to initialize user from auth:", error);
    }
  };

  return {
    user,
    //isSuperAdmin,
    //entiteBase,
    initUserFromAuth,
  };
};
