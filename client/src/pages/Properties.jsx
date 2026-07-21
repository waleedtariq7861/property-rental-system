import { Link, useSearchParams } from 'react-router-dom';

const temporaryNotes = [
  'Property cards, filters, and backend search will be added in the next module.',
  'This page is a temporary destination for the homepage search and navigation link.',
  'The existing API and database foundation stay unchanged in Phase 1.',
];

function Properties() {
  const [searchParams] = useSearchParams();
  const activeFilters = [
    ['City', searchParams.get('city')],
    ['Property Type', searchParams.get('propertyType')],
    ['Minimum Rent', searchParams.get('minRent')],
    ['Maximum Rent', searchParams.get('maxRent')],
  ].filter(([, value]) => value);

  return (
    <section className="page-shell section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="content-card">
              <span className="section-label">Properties</span>
              <h1 className="display-6 fw-bold mt-2 mb-3">
                Property browsing module is being prepared
              </h1>
              <p className="section-intro mb-4">
                RentEase will soon show a searchable property listing experience
                here. For now, this route keeps the navigation and search flow
                working without breaking the Phase 1 foundation.
              </p>

              {activeFilters.length > 0 && (
                <div className="filters-card mb-4">
                  <h2 className="h5 mb-3">Your selected search filters</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {activeFilters.map(([label, value]) => (
                      <span className="filter-chip" key={label}>
                        <strong>{label}:</strong> {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="row g-3">
                {temporaryNotes.map((note) => (
                  <div className="col-md-4" key={note}>
                    <div className="info-tile h-100">
                      <i className="bi bi-info-circle-fill" aria-hidden="true" />
                      <p className="mb-0">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link className="btn btn-brand" to="/">
                  Back to home
                </Link>
                <Link className="btn btn-outline-brand" to="/register">
                  List your property
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Properties;
