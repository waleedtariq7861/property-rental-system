import { NavLink } from 'react-router-dom';

const NAVIGATION_ITEMS = [
  { label: 'Overview', icon: 'bi-grid-1x2-fill', to: '#overview' },
  { label: 'Users', icon: 'bi-people-fill', to: '#users' },
  { label: 'Properties', icon: 'bi-buildings-fill', to: '#properties' },
  { label: 'Rental Requests', icon: 'bi-send-check-fill', to: '#requests' },
];

function NavigationLinks({ mobile = false }) {
  return NAVIGATION_ITEMS.map((item) => (
    <a
      className={mobile ? 'admin-mobile-nav-link' : 'admin-sidebar-link'}
      href={item.to}
      key={item.to}
    >
      <i className={`bi ${item.icon}`} aria-hidden="true" />
      <span>{item.label}</span>
    </a>
  ));
}

export function AdminSidebar({ admin }) {
  return (
    <aside className="admin-sidebar d-none d-lg-flex">
      <div className="admin-sidebar-brand">
        <span aria-hidden="true">
          <i className="bi bi-shield-lock-fill" />
        </span>
        <div>
          <strong>Admin Console</strong>
          <small>RentEase oversight</small>
        </div>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin dashboard">
        <NavigationLinks />
      </nav>

      <NavLink className="admin-sidebar-profile" to="/profile">
        <span aria-hidden="true">{admin.fullName.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{admin.fullName}</strong>
          <small>Administrator</small>
        </div>
      </NavLink>
    </aside>
  );
}

export function AdminMobileNavigation() {
  return (
    <nav className="admin-mobile-nav d-lg-none" aria-label="Admin dashboard">
      <NavigationLinks mobile />
    </nav>
  );
}
