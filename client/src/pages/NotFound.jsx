import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <section className="section-space not-found-section">
      <div className="container text-center">
        <span className="not-found-code">404</span>
        <h1 className="display-5 fw-bold">This address is not available.</h1>
        <p className="section-intro mx-auto mb-4">
          The page may have moved, or the link may be incorrect.
        </p>
        <Link className="btn btn-brand btn-lg" to="/">
          <i className="bi bi-house-door me-2" aria-hidden="true" />
          Return home
        </Link>
      </div>
    </section>
  );
}

export default NotFound;
