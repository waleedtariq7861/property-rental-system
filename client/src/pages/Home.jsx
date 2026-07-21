import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apartmentImage from '../assets/images/property-apartment-islamabad.png';
import houseImage from '../assets/images/property-house-interior.png';
import roomImage from '../assets/images/property-room-studio.png';
import officeImage from '../assets/images/property-office-pakistan.png';
import shopImage from '../assets/images/property-shop-exterior.png';

const propertyTypes = [
  {
    icon: 'bi-house-door-fill',
    title: 'Houses',
    description: 'Family homes and independent houses for long-term rental needs.',
  },
  {
    icon: 'bi-buildings',
    title: 'Apartments',
    description: 'Modern apartments for students, professionals, and small families.',
  },
  {
    icon: 'bi-door-open',
    title: 'Rooms',
    description: 'Single-room rental options for budget-friendly city living.',
  },
  {
    icon: 'bi-building',
    title: 'Offices',
    description: 'Practical workspaces for startups, agencies, and small teams.',
  },
  {
    icon: 'bi-shop',
    title: 'Shops',
    description: 'Commercial spaces for retail activity in active local markets.',
  },
];

const popularLocations = [
  'Islamabad',
  'Rawalpindi',
  'Lahore',
  'Karachi',
];

const howItWorks = [
  {
    icon: 'bi-search',
    title: 'Search Property',
    description: 'Browse available rental options by city, property type, and rent range.',
  },
  {
    icon: 'bi-send-check',
    title: 'Send Rental Request',
    description: 'Share your interest in a property and wait for the owner response.',
  },
  {
    icon: 'bi-person-check',
    title: 'Connect with Owner',
    description: 'Keep communication organized while the project grows into full rental workflows.',
  },
];

const whyChooseRentEase = [
  {
    icon: 'bi-search-heart-fill',
    title: 'Easy Property Search',
    description: 'A simple browsing experience designed for tenants and families.',
  },
  {
    icon: 'bi-chat-dots-fill',
    title: 'Direct Owner Communication',
    description: 'Clear communication between property owners and people looking to rent.',
  },
  {
    icon: 'bi-shield-lock-fill',
    title: 'Secure Rental Requests',
    description: 'A structured foundation for managing rental requests without confusion.',
  },
  {
    icon: 'bi-phone-fill',
    title: 'Responsive Platform',
    description: 'The interface stays usable on desktop, tablet, and mobile screens.',
  },
];

const featuredProperties = [
  {
    image: apartmentImage,
    title: 'Modern Apartment in Islamabad',
    city: 'Islamabad',
    rent: 'PKR 85,000',
    bedrooms: '2 Beds',
    bathrooms: '2 Baths',
    area: '1,250 sq ft',
  },
  {
    image: houseImage,
    title: 'Family House in Rawalpindi',
    city: 'Rawalpindi',
    rent: 'PKR 165,000',
    bedrooms: '4 Beds',
    bathrooms: '4 Baths',
    area: '10 Marla',
  },
  {
    image: roomImage,
    title: 'Studio Room Near University',
    city: 'Lahore',
    rent: 'PKR 48,000',
    bedrooms: '1 Bed',
    bathrooms: '1 Bath',
    area: '620 sq ft',
  },
  {
    image: officeImage,
    title: 'Office Suite in Blue Area',
    city: 'Islamabad',
    rent: 'PKR 130,000',
    bedrooms: 'Open Plan',
    bathrooms: '2 Baths',
    area: '1,500 sq ft',
  },
  {
    image: shopImage,
    title: 'Retail Shop in Karachi',
    city: 'Karachi',
    rent: 'PKR 92,000',
    bedrooms: 'Retail',
    bathrooms: '1 Bath',
    area: '750 sq ft',
  },
  {
    image: apartmentImage,
    title: 'Apartment Near Margalla Road',
    city: 'Islamabad',
    rent: 'PKR 112,000',
    bedrooms: '3 Beds',
    bathrooms: '3 Baths',
    area: '1,450 sq ft',
  },
];

const defaultSearch = {
  city: 'Islamabad',
  propertyType: 'Apartment',
  minRent: '',
  maxRent: '',
};

function Home() {
  const navigate = useNavigate();
  const [searchValues, setSearchValues] = useState(defaultSearch);

  function handleChange(event) {
    const { name, value } = event.target;
    setSearchValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const searchParams = new URLSearchParams();
    Object.entries(searchValues).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    const searchQuery = searchParams.toString();
    navigate(searchQuery ? `/properties?${searchQuery}` : '/properties');
  }

  return (
    <>
      <section className="hero-section">
        <div className="container position-relative hero-inner">
          <div className="row align-items-center min-vh-hero">
            <div className="col-lg-8 col-xl-7">
              <span className="eyebrow mb-3">
                <i className="bi bi-stars" aria-hidden="true" />
                Smart property rentals for Pakistan
              </span>
              <h1 className="display-3 fw-bold text-white mb-4">
                Find the Right Property, Without the Hassle
              </h1>
              <p className="hero-lead mb-4">
                Browse rental properties, connect with property owners, and
                manage rental requests through one simple and reliable platform.
              </p>

              <div className="d-flex flex-wrap gap-3">
                <Link className="btn btn-brand btn-lg px-4" to="/properties">
                  Browse Properties
                </Link>
                <Link className="btn btn-outline-brand btn-lg px-4" to="/register">
                  List Your Property
                </Link>
              </div>
            </div>
          </div>

          <div className="hero-search-shell">
            <div className="search-panel">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <span className="search-panel-kicker">Search rentals</span>
                  <h2 className="h4 mt-1 mb-0">Find your next place</h2>
                </div>
                <span className="search-panel-tag">
                  <i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />
                  Pakistan
                </span>
              </div>

              <form className="row g-3" onSubmit={handleSubmit}>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label" htmlFor="searchCity">
                    City
                  </label>
                  <select
                    className="form-select"
                    id="searchCity"
                    name="city"
                    value={searchValues.city}
                    onChange={handleChange}
                  >
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Peshawar">Peshawar</option>
                  </select>
                </div>

                <div className="col-md-6 col-lg-3">
                  <label className="form-label" htmlFor="searchType">
                    Property Type
                  </label>
                  <select
                    className="form-select"
                    id="searchType"
                    name="propertyType"
                    value={searchValues.propertyType}
                    onChange={handleChange}
                  >
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Room">Room</option>
                    <option value="Office">Office</option>
                    <option value="Shop">Shop</option>
                  </select>
                </div>

                <div className="col-md-6 col-lg-2">
                  <label className="form-label" htmlFor="searchMinRent">
                    Minimum Rent
                  </label>
                  <input
                    className="form-control"
                    id="searchMinRent"
                    name="minRent"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 50000"
                    value={searchValues.minRent}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6 col-lg-2">
                  <label className="form-label" htmlFor="searchMaxRent">
                    Maximum Rent
                  </label>
                  <input
                    className="form-control"
                    id="searchMaxRent"
                    name="maxRent"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="e.g. 150000"
                    value={searchValues.maxRent}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-lg-2 d-flex align-items-end">
                  <button className="btn btn-brand btn-lg w-100" type="submit">
                    Search
                  </button>
                </div>

                <div className="col-12">
                  <p className="search-panel-note mb-0">
                    Property search is being prepared for the next module. For
                    now, this search opens a temporary browsing page with your
                    selected filters.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space section-offset-top bg-white">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span className="section-label">Popular Categories</span>
            <h2 className="display-6 fw-bold mt-2">Browse by property type</h2>
            <p className="section-intro mx-auto mb-0">
              RentEase starts with the most common property categories used in
              Pakistani rental markets.
            </p>
          </div>

          <div className="row g-4">
            {propertyTypes.map((propertyType) => (
              <div className="col-sm-6 col-lg-4 col-xl-2-4" key={propertyType.title}>
                <article className="feature-card h-100 property-type-card">
                  <div className="feature-icon">
                    <i className={`bi ${propertyType.icon}`} aria-hidden="true" />
                  </div>
                  <h3 className="h5">{propertyType.title}</h3>
                  <p className="mb-0">{propertyType.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space section-alt">
        <div className="container">
          <div className="row align-items-center gy-4">
            <div className="col-lg-4">
              <span className="section-label">Popular Cities</span>
              <h2 className="display-6 fw-bold mt-2 mb-3">Where people search most</h2>
              <p className="section-intro mb-0">
                The first version focuses on major cities where students,
                families, and small businesses often start their search.
              </p>
            </div>
            <div className="col-lg-8">
              <div className="location-grid">
                {popularLocations.map((location) => (
                  <div className="location-card" key={location}>
                    <i className="bi bi-geo-alt-fill" aria-hidden="true" />
                    <span>{location}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span className="section-label">Featured Properties</span>
            <h2 className="display-6 fw-bold mt-2">Handpicked property ideas</h2>
            <p className="section-intro mx-auto mb-0">
              Sample listings help the interface feel like a real rental platform
              while the property module is still being prepared.
            </p>
          </div>

          <div className="row g-4">
            {featuredProperties.map((property) => (
              <div className="col-md-6 col-xl-4" key={property.title}>
                <article className="featured-property-card h-100">
                  <div className="featured-property-image-wrap">
                    <img
                      className="featured-property-image"
                      src={property.image}
                      alt={property.title}
                    />
                  </div>
                  <div className="featured-property-body">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                      <div>
                        <h3 className="h5 mb-1">{property.title}</h3>
                        <p className="featured-property-city mb-0">
                          <i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />
                          {property.city}
                        </p>
                      </div>
                      <span className="featured-property-rent">{property.rent}</span>
                    </div>

                    <div className="featured-property-meta">
                      <span>
                        <i className="bi bi-house-door me-1" aria-hidden="true" />
                        {property.bedrooms}
                      </span>
                      <span>
                        <i className="bi bi-droplet-half me-1" aria-hidden="true" />
                        {property.bathrooms}
                      </span>
                      <span>
                        <i className="bi bi-rulers me-1" aria-hidden="true" />
                        {property.area}
                      </span>
                    </div>

                    <Link className="btn btn-outline-brand mt-4 w-100" to="/properties">
                      View Details
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-white">
        <div className="container">
          <div className="section-heading text-center mb-5">
            <span className="section-label">How RentEase works</span>
            <h2 className="display-6 fw-bold mt-2">Simple steps for the rental journey</h2>
          </div>
          <div className="how-works-flow">
            {howItWorks.map((step, index) => (
              <div className="how-works-item" key={step.title}>
                <article className="step-card h-100">
                  <div className="step-number">Step {index + 1}</div>
                  <i className={`bi ${step.icon} step-icon`} aria-hidden="true" />
                  <h3 className="h4">{step.title}</h3>
                  <p className="mb-0">{step.description}</p>
                </article>
                {index < howItWorks.length - 1 && (
                  <div className="flow-arrow" aria-hidden="true">
                    <i className="bi bi-arrow-down" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space section-alt">
        <div className="container">
          <div className="row align-items-center gy-4">
            <div className="col-lg-5">
              <span className="section-label">Why choose RentEase</span>
              <h2 className="display-6 fw-bold mt-2 mb-3">Built around practical rental needs</h2>
              <p className="section-intro mb-0">
                The foundation is intentionally simple, so the project can grow
                into a clear and maintainable property platform in later phases.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="benefit-grid">
                {whyChooseRentEase.map((benefit) => (
                  <article className="benefit-card" key={benefit.title}>
                    <i className={`bi ${benefit.icon}`} aria-hidden="true" />
                    <div>
                      <h3 className="h5 mb-2">{benefit.title}</h3>
                      <p className="mb-0">{benefit.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

export default Home;
