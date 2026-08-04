const CACHE_TTL = 24 * 60 * 60 * 1000;

const fluxDefCache = useState<FluxDetails>("fluxDefCache", () => ({}));

export const useFluxDef = () => {
  const getFluxDef = async (
    type: string
  ): Promise<FluxDetails | null | undefined> => {
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
      } catch {
        //
      }
    }

    // si aucun alors on arrive ici tout en mettant en cache localstorage
    try {
      const { data: user } = useAuth();
      const result = await fetchFluxDetails(type, user.value?.accessToken);
      fluxDefCache.value[type] = result;
      if (import.meta.client) {
        try {
          localStorage.setItem(
            `fluxDef:${type}`,
            JSON.stringify({ data: result, expires: Date.now() + CACHE_TTL })
          );
        } catch {
          //
        }
      }
      return result;
    } catch {
      // Cache mémoire même en échec pour éviter de re-fetcher un flux qui 404 en permanence
      fluxDefCache.value[type] = {};
      return null;
    }
  };

  const fluxDefFor = (type: string): FluxDetails =>
    fluxDefCache.value[type] ?? {};

  return { getFluxDef, fluxDefFor };
};
