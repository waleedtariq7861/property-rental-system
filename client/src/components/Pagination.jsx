function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const visiblePages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage);
  const result = [];

  visiblePages.forEach((page, index) => {
    if (index > 0 && page - visiblePages[index - 1] > 1) {
      result.push(`ellipsis-${page}`);
    }

    result.push(page);
  });

  return result;
}

function Pagination({ currentPage, totalPages, onPageChange, disabled = false }) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="property-pagination" aria-label="Property results pages">
      <button
        type="button"
        disabled={disabled || currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <i className="bi bi-chevron-left" aria-hidden="true" />
        <span>Previous</span>
      </button>

      <div className="property-pagination-pages">
        {getVisiblePages(currentPage, totalPages).map((page) =>
          typeof page === 'string' ? (
            <span className="property-pagination-ellipsis" key={page}>
              …
            </span>
          ) : (
            <button
              className={page === currentPage ? 'is-active' : ''}
              type="button"
              key={page}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={disabled || currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span>Next</span>
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </nav>
  );
}

export default Pagination;
