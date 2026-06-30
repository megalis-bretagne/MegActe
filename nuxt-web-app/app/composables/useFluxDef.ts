const CACHE_TTL = 24 * 60 * 60 * 1000;

const fluxDefCache = useState<Record<string, any>>("fluxDefCache", () => ({}));

export const useFluxDef = () => {
  const config = useRuntimeConfig();
  const { user } = useUserContext();

  const getFluxDef = async (type: string): Promise<Record<string, any>> => {
    // cache memoire
    if (fluxDefCache.value[type]) return fluxDefCache.value[type];

    // cache dansle local storage
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(`fluxDef:${type}`);
        if (raw) {
          const { data, expires } = JSON.parse(raw);
          if (Date.now() < expires) {
            fluxDefCache.value[type] = data;
            return data;
          }
        }
      } catch {}
    }

    // si aucun alors on arrive ici tout en mettant en cache localstorage
    try {
      const result = await $fetch<any>(`/flux/${type}`, {
        baseURL: config.public.apiBaseUrl,
        headers: { Authorization: `Bearer ${user.value?.token}` },
      });
      fluxDefCache.value[type] = result;
      if (import.meta.client) {
        try {
          localStorage.setItem(`fluxDef:${type}`, JSON.stringify({ data: result, expires: Date.now() + CACHE_TTL }));
        } catch {}
      }
      return result;
    } catch {
      return {};
    }
  };

  const fluxDefFor = (type: string) => fluxDefCache.value[type] ?? {};

  return { getFluxDef, fluxDefFor };
};
