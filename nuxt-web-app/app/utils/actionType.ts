interface DataResult {
  url?: string;
}

export interface ActionResult {
  result: boolean;
  message?: string;
  data?: DataResult;
}

// lot of fields are missing: e.g. rule, last-action ...
export interface FluxAction {
  name: string;
  "name-action": string;
}

export type FluxActions = Record<string, FluxAction>;
