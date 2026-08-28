export interface FluxItem {
  id: string;
  nom: string;
}

export interface FluxCount extends FluxItem {
  total: number;
}

export interface FluxTrendSeries {
  id: string;
  nom: string;
  counts: number[]; // aligné sur periods (une valeur par mois)
}

export interface TrendPeriod {
  key: string; // "YYYY-MM"
  label: string;
}

const TREND_MONTHS = 6;
// Échantillon borné par flux : pas un scan complet, donc un flux avec plus de 100
// documents créés sur la fenêtre peut sous-compter les mois les plus anciens.
const TREND_SAMPLE_LIMIT = 100;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(n: number): TrendPeriod[] {
  const now = new Date();
  const months: TrendPeriod[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }),
    });
  }
  return months;
}

// Un seul appel par flux sert 2 besoins : pagination.total pour le compte courant, et les
// documents renvoyés pour l'évolution mensuelle (champ `creation`) — fusionne 2×N requêtes en 1.
export const useFluxStats = (
  entiteId: Ref<number | null>,
  fluxItems: Ref<FluxItem[]>
) => {
  const { data: user } = useAuth();

  // Tri stable par id : l'ordre/la couleur d'une série ne doit pas dépendre du
  // classement par volume (qui peut changer d'un chargement à l'autre).
  const sortedFluxItems = computed(() =>
    [...fluxItems.value].sort((a, b) => a.id.localeCompare(b.id))
  );
  const fluxIds = computed(() => sortedFluxItems.value.map((f) => f.id));
  const periods = computed(() => lastMonths(TREND_MONTHS));

  const queryKey = computed(() => [
    "dashboard-flux-stats",
    entiteId.value,
    fluxIds.value,
  ]);

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      // Promise.allSettled (pas .all) : un flux en erreur (500 transitoire déjà observé sur
      // "autres-studio") ne doit pas faire échouer tout le dashboard.
      const settled = await Promise.allSettled(
        sortedFluxItems.value.map(async (f) => {
          const page = await fetchDocumentsPage(
            entiteId.value!,
            f.id,
            0,
            TREND_SAMPLE_LIMIT
          );
          return {
            ...f,
            total: page.pagination?.total ?? 0,
            documents: page.documents,
          };
        })
      );

      return settled.map((r, i) => {
        if (r.status === "fulfilled") return r.value;
        const f = sortedFluxItems.value[i];
        console.warn(
          `[useFluxStats] flux "${f.id}" en échec, affiché à 0 :`,
          r.reason
        );
        return { ...f, total: 0, documents: [] as DocumentInfo[] };
      });
    },
    enabled: computed(
      () =>
        !!entiteId.value &&
        !!user.value?.accessToken &&
        fluxIds.value.length > 0
    ),
    staleTime: 5 * 60 * 1000,
  });

  const fluxCounts = computed<FluxCount[]>(() =>
    (data.value ?? []).map((f) => ({ id: f.id, nom: f.nom, total: f.total }))
  );
  const total = computed(() =>
    fluxCounts.value.reduce((sum, f) => sum + f.total, 0)
  );

  const series = computed<FluxTrendSeries[]>(() => {
    const keys = periods.value.map((p) => p.key);
    return (data.value ?? []).map((f) => ({
      id: f.id,
      nom: f.nom,
      counts: keys.map(
        (key) =>
          f.documents.filter((d) => d.creation?.slice(0, 7) === key).length
      ),
    }));
  });

  return { fluxCounts, total, periods, series, isFetching };
};
