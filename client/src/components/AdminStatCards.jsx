const STATISTICS = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    description: 'All registered accounts',
    icon: 'bi-people-fill',
    tone: 'blue',
  },
  {
    key: 'totalOwners',
    label: 'Total Owners',
    description: 'Property owner accounts',
    icon: 'bi-person-workspace',
    tone: 'gold',
  },
  {
    key: 'totalTenants',
    label: 'Total Tenants',
    description: 'Tenant accounts',
    icon: 'bi-person-heart',
    tone: 'green',
  },
  {
    key: 'totalProperties',
    label: 'Total Properties',
    description: 'All property records',
    icon: 'bi-buildings-fill',
    tone: 'purple',
  },
  {
    key: 'totalRentalRequests',
    label: 'Rental Requests',
    description: 'Requests across RentEase',
    icon: 'bi-send-check-fill',
    tone: 'red',
  },
];

function AdminStatCards({ statistics }) {
  return (
    <section className="admin-stat-grid" aria-label="Admin dashboard statistics">
      {STATISTICS.map((statistic) => (
        <article className="admin-stat-card" key={statistic.key}>
          <span
            className={`admin-stat-icon is-${statistic.tone}`}
            aria-hidden="true"
          >
            <i className={`bi ${statistic.icon}`} />
          </span>
          <div>
            <span>{statistic.label}</span>
            <strong>{statistics[statistic.key]}</strong>
            <small>{statistic.description}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

export default AdminStatCards;
