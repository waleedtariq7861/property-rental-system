function RentalRequestToolbar({
  idPrefix,
  onClear,
  onSearchChange,
  onStatusChange,
  resultCount,
  searchPlaceholder,
  searchTerm,
  statusFilter,
  statusOptions,
  totalCount,
}) {
  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all';

  return (
    <div className="rental-request-toolbar">
      <div className="rental-request-search">
        <label htmlFor={`${idPrefix}-search`}>Search requests</label>
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

      <div className="rental-request-status-filter">
        <label htmlFor={`${idPrefix}-status`}>Request status</label>
        <select
          id={`${idPrefix}-status`}
          onChange={(event) => onStatusChange(event.target.value)}
          value={statusFilter}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rental-request-toolbar-summary" aria-live="polite">
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

export default RentalRequestToolbar;
