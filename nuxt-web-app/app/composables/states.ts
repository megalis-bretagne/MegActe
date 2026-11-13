export const useSelectedFlux = () =>
  useState<string | null>("selectedFlux", () => null);

export const useSelectedEntiteId = () =>
  useState<number | null>("selectedEntiteId", () => null);

export const usePastellUser = () =>
  useState<pastellUser | null>("pastellUser", () => null);

export const useSidebarCollapsed = () =>
  useState<boolean>("sidebarCollapsed", () => false);
