export interface Pagination {
    offset: number,
    limit: number,
    total: number,
    next: string | null,
    prev: string | null
}