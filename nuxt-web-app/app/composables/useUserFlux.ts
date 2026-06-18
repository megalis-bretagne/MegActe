import { useQuery } from "@tanstack/vue-query";

export interface FluxInfo {
  type: string;
  nom: string;
  enable: boolean;
}

export type FluxResponseModel = Record<string, FluxInfo>;

const fetchUserFlux = async (token: string): Promise<FluxResponseModel> => {
  const config = useRuntimeConfig();
  return await $fetch<FluxResponseModel>("/user/flux", {
    baseURL: config.public.apiBaseUrl,
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const useUserFlux = () => {
  const { user } = useUserContext();

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["userFlux"],
    queryFn: () => fetchUserFlux(user.value?.token),
    enabled: computed(() => !!user.value?.token),
    staleTime: 5 * 60_000,
  });

  const fluxList = computed(() =>
    Object.entries(data.value ?? {}).map(([id, info]) => ({ id, ...info })),
  );

  return { fluxList, isFetching, isError, error };
};
