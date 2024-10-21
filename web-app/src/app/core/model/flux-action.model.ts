export interface DataResult {
    url?: string,
}

export interface ActionResult {
    result: boolean,
    message: string,
    data: DataResult | undefined
}