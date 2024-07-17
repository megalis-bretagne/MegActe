export interface Pagination {
    offset: number,
    limit: number,
    next: string | null,
    prev: string | null
}