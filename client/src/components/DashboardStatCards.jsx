const statisticDefinitions = [
  {
    key: 'totalProperties',
    label: 'Total Properties',
    description: 'All properties in your portfolio',
    icon: 'bi-buildings',
    tone: 'green',
  },
  {
    key: 'activeListings',
    label: 'Active Listings',
    description: 'Approved and currently available',
    icon: 'bi-broadcast-pin',
    tone: 'gold',
  },
  {
    key: 'recentlyAddedProperties',
    label: 'Recently Added',
    description: 'Properties added in the last 7 days',
    icon: 'bi-clock-history',
    tone: 'blue',
  },
];

function DashboardStatCards({ statistics }) {
  return (
    <section aria-labelledby="portfolio-overview-heading">
      <div className="owner-section-heading">
        <div>
          <span className="section-label">Portfolio overview</span>
          <h2 id="portfolio-overview-heading">At a glance</h2>
        </div>
      </div>

      <div className="owner-stat-grid">
        {statisticDefinitions.map((statistic) => (
          <article className="owner-stat-card" key={statistic.key}>
            <div className={`owner-stat-icon is-${statistic.tone}`} aria-hidden="true">
              <i className={`bi ${statistic.icon}`} />
            </div>
            <div>
              <p className="owner-stat-label">{statistic.label}</p>
              <strong>{statistics[statistic.key]}</strong>
              <p className="owner-stat-description">{statistic.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardStatCards;
