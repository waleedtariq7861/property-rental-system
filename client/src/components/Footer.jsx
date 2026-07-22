import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="container py-5">
        <div className="row gy-4 align-items-start">
          <div className="col-lg-4">
            <Link className="footer-brand d-inline-flex align-items-center gap-2 mb-3" to="/">
              <i className="bi bi-buildings-fill" aria-hidden="true" />
              RentEase
            </Link>
            <p className="footer-copy mb-0">
              A clear, dependable foundation for smarter property rentals and
              simpler management.
            </p>
          </div>
          <div className="col-6 col-lg-2">
            <h2 className="footer-heading">Quick Links</h2>
            <ul className="list-unstyled footer-links mb-0">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2">
            <h2 className="footer-heading">Company</h2>
            <ul className="list-unstyled footer-links mb-0">
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              {import.meta.env.DEV && (
                <li><Link to="/system-status">System Status</Link></li>
              )}
            </ul>
          </div>
          <div className="col-12 col-lg-4">
            <h2 className="footer-heading">Contact</h2>
            <ul className="list-unstyled footer-contact mb-3">
              <li>
                <i className="bi bi-envelope" aria-hidden="true" />
                <a href="mailto:waleedtariq7861@gamil.com">waleedtariq7861@gamil.com</a>
              </li>
              <li>
                <i className="bi bi-telephone" aria-hidden="true" />
                <a href="tel:+923480577644">03480577644</a>
              </li>
              <li>
                <i className="bi bi-geo-alt" aria-hidden="true" />
                Islamabad, Pakistan
              </li>
            </ul>
            <div className="footer-socials">
              <a href="https://facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook" aria-hidden="true" />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram" aria-hidden="true" />
              </a>
              <a href="https://linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <i className="bi bi-linkedin" aria-hidden="true" />
              </a>
              <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                <i className="bi bi-whatsapp" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container py-3 d-flex flex-column flex-sm-row justify-content-between gap-2">
          <small>© {new Date().getFullYear()} RentEase. All rights reserved.</small>
          <small>Phase 1 · Project foundation</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
