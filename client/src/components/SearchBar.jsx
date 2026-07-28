function SearchBar({ value, onChange, onClear }) {
  return (
    <div className="property-search">
      <label className="form-label" htmlFor="property-search">
        Search properties
      </label>
      <div className="property-search-input">
        <i className="bi bi-search" aria-hidden="true" />
        <input
          className="form-control"
          id="property-search"
          type="search"
          value={value}
          placeholder="Search by title, city, or address"
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear property search"
            onClick={onClear}
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
