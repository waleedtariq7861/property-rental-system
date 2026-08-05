const summaryCards = [
  {
    field: 'totalRequests',
    label: 'Total Requests',
    icon: 'bi-send-check-fill',
    tone: 'total',
  },
  {
    field: 'pendingRequests',
    label: 'Pending',
    icon: 'bi-hourglass-split',
    tone: 'pending',
  },
  {
    field: 'acceptedRequests',
    label: 'Accepted',
    icon: 'bi-check-circle-fill',
    tone: 'accepted',
  },
  {
    field: 'rejectedRequests',
    label: 'Rejected',
    icon: 'bi-x-circle-fill',
    tone: 'rejected',
  },
];

function TenantRequestSummary({ statistics }) {
  return (
    <section
      className="tenant-summary-grid"
      aria-label="Rental request summary"
    >
      {summaryCards.map((card) => (
        <article className="tenant-summary-card" key={card.field}>
          <span
            className={`tenant-summary-icon is-${card.tone}`}
            aria-hidden="true"
          >
            <i className={`bi ${card.icon}`} />
          </span>
          <div>
            <span>{card.label}</span>
            <strong>{statistics[card.field]}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default TenantRequestSummary;
