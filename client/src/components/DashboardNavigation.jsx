import { NavLink } from 'react-router-dom';

const navigationItems = [
  {
    label: 'Overview',
    icon: 'bi-grid-1x2-fill',
    to: '/owner/dashboard',
    kind: 'route',
  },
  {
    label: 'My Properties',
    icon: 'bi-houses-fill',
    to: '#my-properties',
    kind: 'anchor',
  },
  {
    label: 'Add Property',
    icon: 'bi-house-add-fill',
    to: '/owner/properties/add',
    kind: 'route',
  },
  {
    label: 'Browse Properties',
    icon: 'bi-search',
    to: '/properties',
    kind: 'route',
  },
  {
    label: 'My Profile',
    icon: 'bi-person-circle',
    to: '/profile',
    kind: 'route',
  },
];

function NavigationItems({ mobile = false }) {
  return navigationItems.map((item) => {
    const className = mobile
      ? 'owner-dashboard-mobile-link'
      : 'owner-dashboard-nav-link';
    const content = (
      <>
        <i className={`bi ${item.icon}`} aria-hidden="true" />
        <span>{item.label}</span>
      </>
    );

    if (item.kind === 'anchor') {
      return (
        <a className={className} href={item.to} key={item.to}>
          {content}
        </a>
      );
    }

    return (
      <NavLink
        className={({ isActive }) =>
          `${className}${isActive ? ' is-active' : ''}`
        }
        end={item.to === '/owner/dashboard'}
        key={item.to}
        to={item.to}
      >
        {content}
      </NavLink>
    );
  });
}

export function DashboardSidebar({ owner }) {
  return (
    <aside className="owner-dashboard-sidebar d-none d-lg-flex">
      <div className="owner-dashboard-sidebar-heading">
        <span className="owner-dashboard-sidebar-icon" aria-hidden="true">
          <i className="bi bi-speedometer2" />
        </span>
        <div>
          <strong>Owner Dashboard</strong>
          <span>Property workspace</span>
        </div>
      </div>

      <nav className="owner-dashboard-nav" aria-label="Owner dashboard">
        <NavigationItems />
      </nav>

      <div className="owner-dashboard-account">
        <span aria-hidden="true">{owner.fullName.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{owner.fullName}</strong>
          <small>Property Owner</small>
        </div>
      </div>
    </aside>
  );
}

export function DashboardMobileNavigation() {
  return (
    <nav
      className="owner-dashboard-mobile-nav d-lg-none"
      aria-label="Owner dashboard"
    >
      <NavigationItems mobile />
    </nav>
  );
}
