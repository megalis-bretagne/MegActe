interface DataResult {
  url?: string;
}

export interface ActionResult {
  result: boolean;
  message: string;
  data?: DataResult;
}

export interface ActionError {
  status?: number;
  data?: { detail?: string };
  message?: string;
}

// lot of fields are missing: e.g. rule, last-action ...
export interface FluxAction {
  name: string;
  "name-action": string;
}

export type FluxActions = Record<string, FluxAction>;
