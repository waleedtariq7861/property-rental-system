const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price Low → High' },
  { value: 'price_desc', label: 'Price High → Low' },
];

function SortDropdown({ value, onChange }) {
  return (
    <div className="property-sort">
      <label className="form-label" htmlFor="property-sort">
        Sort by
      </label>
      <select
        className="form-select"
        id="property-sort"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortDropdown;
