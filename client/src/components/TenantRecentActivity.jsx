import { formatPropertyDate } from '../utils/propertyFormatting.js';

const ACTIVITY_CONTENT = Object.freeze({
  pending: {
    icon: 'bi-send-fill',
    label: 'Request sent',
    text: 'Waiting for the property owner to review your request.',
  },
  approved: {
    icon: 'bi-check-circle-fill',
    label: 'Request accepted',
    text: 'The property owner accepted your rental request.',
  },
  rejected: {
    icon: 'bi-x-circle-fill',
    label: 'Request rejected',
    text: 'The property owner declined your rental request.',
  },
  cancelled: {
    icon: 'bi-slash-circle-fill',
    label: 'Request cancelled',
    text: 'You cancelled this rental request.',
  },
  completed: {
    icon: 'bi-house-check-fill',
    label: 'Request completed',
    text: 'This rental request has been completed.',
  },
});

function getActivityTimestamp(rentalRequest) {
  return rentalRequest.updatedAt || rentalRequest.createdAt;
}

function TenantRecentActivity({ rentalRequests }) {
  const recentRequests = [...rentalRequests]
    .sort(
      (firstRequest, secondRequest) =>
        new Date(getActivityTimestamp(secondRequest)).getTime() -
        new Date(getActivityTimestamp(firstRequest)).getTime(),
    )
    .slice(0, 4);

  if (recentRequests.length === 0) {
    return null;
  }

  return (
    <section
      className="tenant-activity-section"
      aria-labelledby="tenant-activity-heading"
    >
      <div className="tenant-section-heading">
        <div>
          <span>Latest updates</span>
          <h2 id="tenant-activity-heading">Recent Activity</h2>
        </div>
      </div>

      <ol className="tenant-activity-list">
        {recentRequests.map((rentalRequest) => {
          const activity =
            ACTIVITY_CONTENT[rentalRequest.status] || ACTIVITY_CONTENT.pending;
          const timestamp = getActivityTimestamp(rentalRequest);

          return (
            <li className={`is-${rentalRequest.status}`} key={rentalRequest.id}>
              <span className="tenant-activity-icon" aria-hidden="true">
                <i className={`bi ${activity.icon}`} />
              </span>
              <div>
                <strong>{activity.label}</strong>
                <span>{rentalRequest.propertyTitle}</span>
                <p>{activity.text}</p>
              </div>
              <time dateTime={timestamp}>{formatPropertyDate(timestamp)}</time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default TenantRecentActivity;
