import { Link } from 'react-router-dom';

function Register() {
  return (
    <section className="auth-section section-space">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-7">
            <div className="auth-card">
              <div className="text-center mb-4">
                <span className="auth-icon"><i className="bi bi-person-plus" aria-hidden="true" /></span>
                <h1 className="h2 mt-3 mb-2">Create your account</h1>
                <p className="text-secondary mb-0">Registration UI foundation for tenants and owners</p>
              </div>
              <div className="alert alert-info small" role="status">
                Account creation will be implemented securely in Phase 2. No information entered here is submitted.
              </div>
              <form onSubmit={(event) => event.preventDefault()}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerName">Full name</label>
                    <input className="form-control" id="registerName" type="text" autoComplete="name" placeholder="Your full name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerEmail">Email address</label>
                    <input className="form-control" id="registerEmail" type="email" autoComplete="email" placeholder="name@example.com" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerPhone">Phone number</label>
                    <input className="form-control" id="registerPhone" type="tel" autoComplete="tel" placeholder="Your phone number" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerRole">I want to</label>
                    <select className="form-select" id="registerRole" defaultValue="tenant">
                      <option value="tenant">Rent a property</option>
                      <option value="owner">List properties</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerPassword">Password</label>
                    <input className="form-control" id="registerPassword" type="password" autoComplete="new-password" placeholder="Create a password" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="registerPasswordConfirm">Confirm password</label>
                    <input className="form-control" id="registerPasswordConfirm" type="password" autoComplete="new-password" placeholder="Repeat your password" />
                  </div>
                  <div className="col-12 mt-4">
                    <button className="btn btn-brand btn-lg w-100" type="submit" disabled>
                      Registration available in Phase 2
                    </button>
                  </div>
                </div>
              </form>
              <p className="text-center text-secondary mt-4 mb-0">
                Already have an account? <Link to="/login">Preview sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Register;
