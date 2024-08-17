export function getPagination(currentPage, totalPages, firstPage = 1) {

    const maxPagesToShow = 7;

    // Determine the start and end pages
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        // If total pages are less than or equal to maxPagesToShow, display all pages
        startPage = firstPage;
        endPage = totalPages;
    } else {
        // Calculate startPage and endPage based on the currentPage
        const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;

        if (currentPage <= maxPagesBeforeCurrentPage) {
            // Near the start
            startPage = firstPage;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
            // Near the end
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            // Somewhere in the middle
            startPage = currentPage - maxPagesBeforeCurrentPage;
            endPage = currentPage + maxPagesAfterCurrentPage;
        }
    }

    // Adjust for cases when startPage or endPage goes out of bounds
    if (startPage < firstPage) {
        startPage = firstPage;
        endPage = Math.min(firstPage + maxPagesToShow - 1, totalPages);
    }

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(totalPages - maxPagesToShow + 1, firstPage);
    }

    const paginationRange = [];
    for (let i = startPage; i <= endPage; i++) {
        paginationRange.push(i);
    }

    return paginationRange;
}
