import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navigationItems = [
  { label: 'Home', to: '/' },
  { label: 'Properties', to: '/properties' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, isRestoring, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(location.pathname !== '/');

  useEffect(() => {
    function updateNavbarState() {
      setIsScrolled(location.pathname !== '/' || window.scrollY > 16);
    }

    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState, { passive: true });
    return () => window.removeEventListener('scroll', updateNavbarState);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }) =>
    `nav-link px-lg-3${isActive ? ' active' : ''}`;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <nav className={`navbar navbar-dark navbar-expand-lg sticky-top site-navbar${isScrolled ? ' is-scrolled' : ' is-hero'}`}>
      <div className="container">
        <NavLink className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span className="brand-mark" aria-hidden="true">
            <i className="bi bi-buildings-fill" />
          </span>
          RentEase
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavigation"
          aria-controls="mainNavigation"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNavigation">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            {navigationItems.map((item) => (
              <li className="nav-item" key={item.to}>
                <NavLink className={navLinkClass} to={item.to} end={item.to === '/'}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            {!isRestoring && isAuthenticated ? (
              <>
                {currentUser.role === 'owner' && (
                  <li className="nav-item ms-lg-2">
                    <NavLink className="nav-link" to="/owner/dashboard">
                      Dashboard
                    </NavLink>
                  </li>
                )}
                <li className="nav-item ms-lg-2">
                  <NavLink className="nav-link" to="/profile">
                    {currentUser.fullName}
                  </NavLink>
                </li>
                <li className="nav-item ms-lg-1 mt-2 mt-lg-0">
                  <button
                    className={`btn px-3 ${
                      isScrolled ? 'btn-outline-brand' : 'btn-brand-light'
                    }`}
                    onClick={handleLogout}
                    type="button"
                  >
                    Log out
                  </button>
                </li>
              </>
            ) : !isRestoring ? (
              <>
                <li className="nav-item ms-lg-2">
                  <NavLink className="nav-link" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item ms-lg-1 mt-2 mt-lg-0">
                  <NavLink className="btn btn-brand-light px-3" to="/register">
                    Register
                  </NavLink>
                </li>
              </>
            ) : null}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
