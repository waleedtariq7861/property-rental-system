const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'office', label: 'Office' },
  { value: 'studio', label: 'Studio' },
  { value: 'portion', label: 'Portion' },
  { value: 'room', label: 'Room' },
  { value: 'shop', label: 'Shop' },
];

function FilterPanel({
  filters,
  hasActiveFilters,
  hasInvalidPriceRange,
  onChange,
  onReset,
}) {
  function handleChange(event) {
    onChange(event.target.name, event.target.value);
  }

  return (
    <div className="property-filter-panel">
      <div className="property-filter-heading">
        <div>
          <span className="property-control-kicker">Refine results</span>
          <h2 className="h5 mb-0">Filters</h2>
        </div>
        <button
          className="property-filter-reset"
          type="button"
          disabled={!hasActiveFilters}
          onClick={onReset}
        >
          Reset filters
        </button>
      </div>

      <div className="property-filter-grid">
        <div>
          <label className="form-label" htmlFor="property-city-filter">
            City
          </label>
          <input
            className="form-control"
            id="property-city-filter"
            name="city"
            type="text"
            value={filters.city}
            placeholder="e.g. Islamabad"
            autoComplete="address-level2"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="property-type-filter">
            Property type
          </label>
          <select
            className="form-select"
            id="property-type-filter"
            name="propertyType"
            value={filters.propertyType}
            onChange={handleChange}
          >
            <option value="">All property types</option>
            {propertyTypes.map((propertyType) => (
              <option key={propertyType.value} value={propertyType.value}>
                {propertyType.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label" htmlFor="property-min-price-filter">
            Minimum price
          </label>
          <div className="property-price-input">
            <span>PKR</span>
            <input
              className={`form-control${hasInvalidPriceRange ? ' is-invalid' : ''}`}
              id="property-min-price-filter"
              name="minPrice"
              type="number"
              min="0"
              step="1000"
              value={filters.minPrice}
              placeholder="No minimum"
              aria-describedby={
                hasInvalidPriceRange ? 'property-price-range-error' : undefined
              }
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="property-max-price-filter">
            Maximum price
          </label>
          <div className="property-price-input">
            <span>PKR</span>
            <input
              className={`form-control${hasInvalidPriceRange ? ' is-invalid' : ''}`}
              id="property-max-price-filter"
              name="maxPrice"
              type="number"
              min="0"
              step="1000"
              value={filters.maxPrice}
              placeholder="No maximum"
              aria-describedby={
                hasInvalidPriceRange ? 'property-price-range-error' : undefined
              }
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="property-bedroom-filter">
            Bedrooms
          </label>
          <input
            className="form-control"
            id="property-bedroom-filter"
            name="bedrooms"
            type="number"
            min="0"
            step="1"
            value={filters.bedrooms}
            placeholder="Any number"
            onChange={handleChange}
          />
        </div>
      </div>

      {hasInvalidPriceRange && (
        <p
          className="property-filter-error"
          id="property-price-range-error"
          role="alert"
        >
          Minimum price cannot be greater than maximum price.
        </p>
      )}
    </div>
  );
}

export default FilterPanel;
