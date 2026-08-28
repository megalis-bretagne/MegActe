export const dateToISO = (d: Date): string => d.toISOString().split("T")[0];

export const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// Pour les champs de type "date" pure (pas d'horodatage) : contrairement à formatDate(),
// n'affiche pas d'heure.
export const formatDateOnly = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
};

export const isWithinDays = (d: string, days: number): boolean => {
  if (!d) return false;
  const elapsedMs = Date.now() - new Date(d).getTime();
  return elapsedMs >= 0 && elapsedMs <= days * 24 * 60 * 60 * 1000;
};
