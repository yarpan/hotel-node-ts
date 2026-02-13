// Export common types and interfaces

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
    errors?: any;
}

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}

export interface SearchParams {
    query?: string;
    sort?: string;
    fields?: string;
}
