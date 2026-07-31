import { useEffect, useMemo, useState } from 'react';
import FilterPanel from '../components/FilterPanel.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Pagination from '../components/Pagination.jsx';
import PropertyCard from '../components/PropertyCard.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SortDropdown from '../components/SortDropdown.jsx';
import {
  getProperties,
  PROPERTY_DATA_CHANGED_EVENT,
} from '../services/propertyService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

const PROPERTY_CHANGE_EVENT =
  PROPERTY_DATA_CHANGED_EVENT || 'rentease:properties-changed';

const PAGE_LIMIT = 9;
const emptyFilters = Object.freeze({
  city: '',
  propertyType: '',
  minPrice: '',
  maxPrice: '',
  bedrooms: '',
});

function Properties() {
  const [properties, setProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ ...emptyFilters });
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  const hasInvalidPriceRange =
    filters.minPrice !== '' &&
    filters.maxPrice !== '' &&
    Number(filters.minPrice) > Number(filters.maxPrice);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const hasActiveCriteria = Boolean(debouncedSearch) || hasActiveFilters;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const queryParameters = useMemo(() => {
    const parameters = {
      sort,
      page: currentPage,
      limit: PAGE_LIMIT,
    };

    if (debouncedSearch) {
      parameters.search = debouncedSearch;
    }

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== '') {
        parameters[field] = value;
      }
    });

    return parameters;
  }, [currentPage, debouncedSearch, filters, sort]);

  useEffect(() => {
    if (hasInvalidPriceRange) {
      setProperties([]);
      setTotalCount(0);
      setTotalPages(0);
      setErrorMessage('');
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();

    async function loadProperties() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result = await getProperties({
          params: queryParameters,
          signal: controller.signal,
        });
        const nextProperties = result.data?.properties;

        if (!Array.isArray(nextProperties)) {
          throw new TypeError('The property response is not in the expected format.');
        }

        const nextTotalCount = Number(
          result.data?.totalCount ?? result.data?.count ?? nextProperties.length,
        );
        const nextCurrentPage = Number(result.data?.currentPage ?? currentPage);
        const nextTotalPages = Number(
          result.data?.totalPages ??
            Math.ceil(nextTotalCount / queryParameters.limit),
        );

        setProperties(nextProperties);
        setTotalCount(Number.isFinite(nextTotalCount) ? nextTotalCount : 0);
        setCurrentPage(
          Number.isInteger(nextCurrentPage) && nextCurrentPage > 0
            ? nextCurrentPage
            : 1,
        );
        setTotalPages(
          Number.isInteger(nextTotalPages) && nextTotalPages >= 0
            ? nextTotalPages
            : 0,
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setProperties([]);
        setTotalCount(0);
        setTotalPages(0);
        setErrorMessage(
          error instanceof TypeError
            ? 'Property data could not be loaded. Please try again shortly.'
            : getApiErrorMessage(error),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProperties();

    return () => controller.abort();
  }, [
    currentPage,
    debouncedSearch,
    filters,
    hasInvalidPriceRange,
    queryParameters,
    requestKey,
    sort,
  ]);

  useEffect(() => {
    function refreshProperties() {
      setRequestKey((currentKey) => currentKey + 1);
    }

    window.addEventListener(PROPERTY_CHANGE_EVENT, refreshProperties);
    return () =>
      window.removeEventListener(PROPERTY_CHANGE_EVENT, refreshProperties);
  }, []);

  function handleFilterChange(field, value) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
    setCurrentPage(1);
  }

  function handleSortChange(value) {
    setSort(value);
    setCurrentPage(1);
  }

  function resetDiscoveryControls() {
    setSearchTerm('');
    setDebouncedSearch('');
    setFilters({ ...emptyFilters });
    setCurrentPage(1);
  }

  const firstResult =
    totalCount === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const lastResult = Math.min(currentPage * PAGE_LIMIT, totalCount);

  return (
    <div className="page-shell properties-page">
      <section className="properties-heading-section">
        <div className="container">
          <div className="properties-heading-content">
            <div>
              <span className="section-label">Available rentals</span>
              <h1 className="display-5 fw-bold mt-2 mb-3">
                Find a place that feels right
              </h1>
              <p className="section-intro mb-0">
                Search and compare verified rental opportunities across Pakistan
                using the details that matter to you.
              </p>
            </div>

            {!isLoading && !errorMessage && !hasInvalidPriceRange && (
              <div className="property-result-count" aria-live="polite">
                <strong>{totalCount}</strong>
                <span>{totalCount === 1 ? 'property found' : 'properties found'}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="property-discovery-section" aria-label="Property search">
        <div className="container">
          <div className="property-discovery-card">
            <div className="property-toolbar">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
              />
              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>
            <FilterPanel
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              hasInvalidPriceRange={hasInvalidPriceRange}
              onChange={handleFilterChange}
              onReset={() => {
                setFilters({ ...emptyFilters });
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </section>

      <section className="properties-grid-section">
        <div className="container">
          {!isLoading &&
            !errorMessage &&
            !hasInvalidPriceRange &&
            totalCount > 0 && (
              <div className="property-results-summary" aria-live="polite">
                <p className="mb-0">
                  Showing <strong>{firstResult}–{lastResult}</strong> of{' '}
                  <strong>{totalCount}</strong> properties
                </p>
                {hasActiveCriteria && (
                  <button type="button" onClick={resetDiscoveryControls}>
                    Clear search and filters
                  </button>
                )}
              </div>
            )}

          {isLoading && (
            <div className="property-state-card" aria-live="polite">
              <LoadingSpinner label="Loading properties..." />
              <p className="mb-0">Finding rentals that match your preferences.</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="property-state-card property-error-state" role="alert">
              <span className="property-state-icon" aria-hidden="true">
                <i className="bi bi-exclamation-triangle" />
              </span>
              <h2 className="h4">We could not load the properties</h2>
              <p>{errorMessage}</p>
              <button
                className="btn btn-brand"
                type="button"
                onClick={() => setRequestKey((currentKey) => currentKey + 1)}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && hasInvalidPriceRange && (
            <div className="property-state-card">
              <span className="property-state-icon" aria-hidden="true">
                <i className="bi bi-sliders" />
              </span>
              <h2 className="h4">Check the selected price range</h2>
              <p className="mb-0">
                Enter a maximum price that is equal to or greater than the
                minimum price.
              </p>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            !hasInvalidPriceRange &&
            properties.length === 0 && (
              <div className="property-state-card">
                <span className="property-state-icon" aria-hidden="true">
                  <i
                    className={`bi ${
                      hasActiveCriteria ? 'bi-search' : 'bi-house-heart'
                    }`}
                  />
                </span>
                <h2 className="h4">
                  {hasActiveCriteria
                    ? 'No properties match your search'
                    : 'No properties are available right now'}
                </h2>
                <p>
                  {hasActiveCriteria
                    ? 'Try a different search term or broaden one of your filters.'
                    : 'New listings are added regularly. Please check back again soon.'}
                </p>
                {hasActiveCriteria && (
                  <button
                    className="btn btn-brand"
                    type="button"
                    onClick={resetDiscoveryControls}
                  >
                    Clear search and filters
                  </button>
                )}
              </div>
            )}

          {!isLoading && !errorMessage && properties.length > 0 && (
            <>
              <div className="row g-4">
                {properties.map((property) => (
                  <div className="col-md-6 col-xl-4" key={property.id}>
                    <PropertyCard property={property} />
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Properties;
