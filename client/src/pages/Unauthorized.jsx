import { Link, useLocation } from 'react-router-dom';

function Unauthorized() {
  const location = useLocation();

  return (
    <section className="section-space not-found-section">
      <div className="container text-center">
        <span className="unauthorized-icon" aria-hidden="true">
          <i className="bi bi-shield-lock-fill" />
        </span>
        <h1 className="display-5 fw-bold">Access is not authorized.</h1>
        <p className="section-intro mx-auto mb-4">
          Your account role does not have permission to open
          {location.state?.from ? ` ${location.state.from}` : ' this page'}.
        </p>
        <Link className="btn btn-brand btn-lg" to="/profile">
          Return to profile
        </Link>
      </div>
    </section>
  );
}

export default Unauthorized;
