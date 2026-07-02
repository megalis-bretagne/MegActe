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
