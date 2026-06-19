const user = ref<userSession>(null);
const pastellReady = ref(false);
const selectedFlux = ref<string | null>(null);

export const useUserContext = () => {
  const { data: authData, status } = useAuth()

  const getPastellUser = (authData: object, status: string) => {
    return useQuery({
      queryKey: ['pastellUser'],
      queryFn: () => fetchUser(authData.value?.accessToken),
      initialData: authData.value?.pastellUser ?? null,
      enabled: status === 'authenticated' && !!authData.value?.accessToken,
      staleTime: Infinity,
    })
  }

  const getPastellUserFlux = (authData: object, status: string) => {
    return useQuery({
      queryKey: ['pastellUserFlux'],
      queryFn: () => fetchUserFlux(authData.value?.accessToken),
      initialData: authData.value?.pastellUserFlux ?? null,
      enabled: status === 'authenticated' && !!authData.value?.accessToken,
      staleTime: Infinity,
    })
  }

  const { data, isLoading, isSuccess, error } = getPastellUser(authData, status.value);

  if (status.value === 'authenticated') {
    console.log("useUserContext: user is authenticated");
  } else {
    console.warn("useUserContext: user is not authenticated");
  }

  if (isSuccess) {
    console.log("getPastellUser success");
    if (authData.value) {
      user.value = {
        ...authData.value?.user,
        pastellUser: data,
        token: authData.value?.accessToken,
      }
      pastellReady.value = true
    }
  } else {
    // Keep server data if fetch fails, or null if no server data
    console.log('getPastellUser error: ', error?.code);
    if (authData.value) {
      user.value = {
        ...authData.value?.user,
        pastellUser: authData.value?.pastellUser ?? null,
        token: authData.value?.accessToken,
      }
      pastellReady.value = true
    }
  }

  const { data: fluxData, isLoading: fluxIsLoading, isSuccess: fluxIsSuccess, error: fluxError } = getPastellUserFlux(authData, status.value);
  if (fluxIsSuccess) {
    console.log("getPastellUserFlux success");
    user.value = {
      ...user.value,
      flux: fluxData,
    }
  } else {
    console.log('getPastellUserFlux error: ', fluxError?.code);
    user.value = {
      ...user.value,
      flux: authData.value?.pastellUserFlux ?? null,
    }

  }

  console.log("user name = ", user.value?.name);
  console.log("acces token = ", user.value?.token);
  console.log("user object: ");
  console.log(user.value);

  return {
    isLoading,
    user,
    pastellReady
  };
};
