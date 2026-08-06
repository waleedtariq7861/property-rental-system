function AdminFilterToolbar({
  filters,
  idPrefix,
  onClear,
  onSearchChange,
  resultCount,
  searchPlaceholder,
  searchTerm,
  totalCount,
}) {
  const hasActiveFilters =
    searchTerm.trim() || filters.some((filter) => filter.value !== 'all');

  return (
    <div className="admin-filter-toolbar">
      <div className="admin-filter-search">
        <label htmlFor={`${idPrefix}-search`}>Search</label>
        <div>
          <i className="bi bi-search" aria-hidden="true" />
          <input
            autoComplete="off"
            id={`${idPrefix}-search`}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={searchTerm}
          />
        </div>
      </div>

      {filters.map((filter) => (
        <div className="admin-filter-select" key={filter.id}>
          <label htmlFor={filter.id}>{filter.label}</label>
          <select
            id={filter.id}
            onChange={(event) => filter.onChange(event.target.value)}
            value={filter.value}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="admin-filter-summary" aria-live="polite">
        <span>{`Showing ${resultCount} of ${totalCount}`}</span>
        {hasActiveFilters && (
          <button className="btn btn-link" onClick={onClear} type="button">
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export default AdminFilterToolbar;
