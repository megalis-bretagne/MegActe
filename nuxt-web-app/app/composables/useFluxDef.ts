const CACHE_TTL = 24 * 60 * 60 * 1000;

export const useFluxDef = () => {
  // useState() doit être appelé dans un contexte Nuxt valide : au niveau module, il tournerait
  // une seule fois hors contexte de requête — plante en SSR et partagerait l'état entre requêtes.
  const fluxDefCache = useState<FluxDetails>("fluxDefCache", () => ({}));

  const getFluxDef = async (
    type: string
  ): Promise<FluxDetails | null | undefined> => {
    if (fluxDefCache.value[type]) return fluxDefCache.value[type];

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

    try {
      const result = await fetchFluxDetails(type);
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
