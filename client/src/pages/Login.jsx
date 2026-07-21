import { Link } from 'react-router-dom';

function Login() {
  return (
    <section className="auth-section section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="auth-card">
              <div className="text-center mb-4">
                <span className="auth-icon"><i className="bi bi-person-lock" aria-hidden="true" /></span>
                <h1 className="h2 mt-3 mb-2">Welcome back</h1>
                <p className="text-secondary mb-0">Sign-in UI foundation for RentEase</p>
              </div>
              <div className="alert alert-info small" role="status">
                Authentication will be enabled in Phase 2. This form is currently a design preview.
              </div>
              <form onSubmit={(event) => event.preventDefault()}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="loginEmail">Email address</label>
                  <input className="form-control form-control-lg" id="loginEmail" type="email" autoComplete="email" placeholder="name@example.com" />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="loginPassword">Password</label>
                  <input className="form-control form-control-lg" id="loginPassword" type="password" autoComplete="current-password" placeholder="Enter your password" />
                </div>
                <button className="btn btn-brand btn-lg w-100" type="submit" disabled>
                  Sign in available in Phase 2
                </button>
              </form>
              <p className="text-center text-secondary mt-4 mb-0">
                New to RentEase? <Link to="/register">Preview registration</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
