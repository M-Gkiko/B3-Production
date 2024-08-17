export function extractHeaders(response) {
    return {
        total: response.headers.get('X-Total'),
        totalPages: response.headers.get('X-Total-Pages'),
        currentPage: response.headers.get('X-Page'),
        prevPage: response.headers.get('X-Prev-Page'),
        nextPage: response.headers.get('X-Next-Page')
    };
}
