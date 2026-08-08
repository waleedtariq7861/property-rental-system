import { useEffect, useMemo, useState } from 'react';
import {
  AdminMobileNavigation,
  AdminSidebar,
} from '../components/AdminDashboardNavigation.jsx';
import {
  AdminPropertiesTable,
  AdminRentalRequestsTable,
  AdminUsersTable,
} from '../components/AdminDataTables.jsx';
import AdminConfirmationModal from '../components/AdminConfirmationModal.jsx';
import AdminDetailsModal from '../components/AdminDetailsModal.jsx';
import AdminFilterToolbar from '../components/AdminFilterToolbar.jsx';
import AdminRecentPanels from '../components/AdminRecentPanels.jsx';
import AdminStatCards from '../components/AdminStatCards.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  deleteAdminProperty,
  deleteAdminUser,
  getAdminDashboard,
  getAdminProperties,
  getAdminRentalRequests,
  getAdminUsers,
  updateAdminUserStatus,
} from '../services/adminDashboardService.js';
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js';

const USER_ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'owner', label: 'Owners' },
  { value: 'tenant', label: 'Tenants' },
];

const ACCOUNT_STATUS_OPTIONS = [
  { value: 'all', label: 'All account statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'all', label: 'All property types' },
  { value: 'apartment', label: 'Apartments' },
  { value: 'house', label: 'Houses' },
  { value: 'villa', label: 'Villas' },
  { value: 'office', label: 'Offices' },
  { value: 'studio', label: 'Studios' },
  { value: 'portion', label: 'Portions' },
  { value: 'room', label: 'Rooms' },
  { value: 'shop', label: 'Shops' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All availability' },
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
  { value: 'unavailable', label: 'Unavailable' },
];

const APPROVAL_OPTIONS = [
  { value: 'all', label: 'All approvals' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const RENTAL_REQUEST_STATUS_OPTIONS = [
  { value: 'all', label: 'All request statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

const STATISTIC_FIELDS = [
  'totalUsers',
  'totalOwners',
  'totalTenants',
  'totalProperties',
  'totalRentalRequests',
];

function isAdminDashboardResponse(data) {
  return (
    data?.admin?.role === 'admin' &&
    STATISTIC_FIELDS.every((field) =>
      Number.isFinite(Number(data?.statistics?.[field])),
    ) &&
    Array.isArray(data?.recentUsers) &&
    Array.isArray(data?.recentProperties) &&
    Array.isArray(data?.recentRequests)
  );
}

function isUsersResponse(data) {
  return (
    Array.isArray(data?.users) &&
    data.users.every(
      (user) =>
        Number.isFinite(Number(user?.id)) &&
        typeof user?.fullName === 'string' &&
        typeof user?.email === 'string' &&
        typeof user?.role === 'string' &&
        typeof user?.accountStatus === 'string' &&
        typeof user?.createdAt === 'string',
    )
  );
}

function isPropertiesResponse(data) {
  return (
    Array.isArray(data?.properties) &&
    data.properties.every(
      (property) =>
        Number.isFinite(Number(property?.id)) &&
        typeof property?.title === 'string' &&
        typeof property?.ownerName === 'string' &&
        typeof property?.propertyType === 'string' &&
        Number.isFinite(Number(property?.price)) &&
        typeof property?.availabilityStatus === 'string' &&
        typeof property?.approvalStatus === 'string',
    )
  );
}

function isRentalRequestsResponse(data) {
  return (
    Array.isArray(data?.rentalRequests) &&
    data.rentalRequests.every(
      (rentalRequest) =>
        Number.isFinite(Number(rentalRequest?.id)) &&
        typeof rentalRequest?.propertyTitle === 'string' &&
        typeof rentalRequest?.tenantName === 'string' &&
        typeof rentalRequest?.ownerName === 'string' &&
        typeof rentalRequest?.status === 'string' &&
        typeof rentalRequest?.createdAt === 'string',
    )
  );
}

function AdminSectionHeading({ count, eyebrow, id, title }) {
  return (
    <div className="admin-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2 id={id}>{title}</h2>
      </div>
      <strong>{count}</strong>
    </div>
  );
}

function AdminDashboard() {
  const { currentUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [requestKey, setRequestKey] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [accountStatus, setAccountStatus] = useState('all');
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [availabilityStatus, setAvailabilityStatus] = useState('all');
  const [approvalStatus, setApprovalStatus] = useState('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState('all');
  const [activeAction, setActiveAction] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [confirmationError, setConfirmationError] = useState('');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAdminData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const options = { signal: controller.signal };
        const [dashboardResult, usersResult, propertiesResult, requestsResult] =
          await Promise.all([
            getAdminDashboard(options),
            getAdminUsers(options),
            getAdminProperties(options),
            getAdminRentalRequests(options),
          ]);

        if (
          !isAdminDashboardResponse(dashboardResult.data) ||
          !isUsersResponse(usersResult.data) ||
          !isPropertiesResponse(propertiesResult.data) ||
          !isRentalRequestsResponse(requestsResult.data)
        ) {
          throw new TypeError('The admin dashboard response is invalid.');
        }

        setDashboard(dashboardResult.data);
        setUsers(usersResult.data.users);
        setProperties(propertiesResult.data.properties);
        setRentalRequests(requestsResult.data.rentalRequests);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDashboard(null);
        setUsers([]);
        setProperties([]);
        setRentalRequests([]);
        setErrorMessage(
          error instanceof TypeError
            ? 'Admin dashboard data could not be loaded. Please try again shortly.'
            : getApiErrorMessage(error),
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAdminData();
    return () => controller.abort();
  }, [requestKey]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = userRole === 'all' || user.role === userRole;
      const matchesStatus =
        accountStatus === 'all' || user.accountStatus === accountStatus;
      const searchContent = [
        user.fullName,
        user.email,
        user.phone,
        user.role,
        user.accountStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesRole && matchesStatus && searchContent.includes(normalizedSearch);
    });
  }, [accountStatus, userRole, userSearch, users]);

  const filteredProperties = useMemo(() => {
    const normalizedSearch = propertySearch.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesType =
        propertyType === 'all' || property.propertyType === propertyType;
      const matchesAvailability =
        availabilityStatus === 'all' ||
        property.availabilityStatus === availabilityStatus;
      const matchesApproval =
        approvalStatus === 'all' || property.approvalStatus === approvalStatus;
      const searchContent = [
        property.title,
        property.description,
        property.ownerName,
        property.ownerEmail,
        property.city,
        property.area,
        property.address,
        property.propertyType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesType &&
        matchesAvailability &&
        matchesApproval &&
        searchContent.includes(normalizedSearch)
      );
    });
  }, [
    approvalStatus,
    availabilityStatus,
    properties,
    propertySearch,
    propertyType,
  ]);

  const filteredRentalRequests = useMemo(() => {
    const normalizedSearch = requestSearch.trim().toLowerCase();

    return rentalRequests.filter((rentalRequest) => {
      const matchesStatus =
        requestStatus === 'all' || rentalRequest.status === requestStatus;
      const searchContent = [
        rentalRequest.propertyTitle,
        rentalRequest.propertyCity,
        rentalRequest.propertyType,
        rentalRequest.tenantName,
        rentalRequest.tenantEmail,
        rentalRequest.ownerName,
        rentalRequest.ownerEmail,
        rentalRequest.message,
        rentalRequest.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && searchContent.includes(normalizedSearch);
    });
  }, [rentalRequests, requestSearch, requestStatus]);

  function replaceUser(updatedUser) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        Number(user.id) === Number(updatedUser.id) ? updatedUser : user,
      ),
    );
    setDashboard((currentDashboard) =>
      currentDashboard
        ? {
            ...currentDashboard,
            recentUsers: currentDashboard.recentUsers.map((user) =>
              Number(user.id) === Number(updatedUser.id) ? updatedUser : user,
            ),
          }
        : currentDashboard,
    );
  }

  async function handleUserStatusChange(user, accountStatusValue) {
    setActionFeedback(null);
    setActiveAction(`user-status-${user.id}`);

    try {
      const result = await updateAdminUserStatus(user.id, accountStatusValue);
      const updatedUser = result.data?.user;

      if (!isUsersResponse({ users: [updatedUser] })) {
        throw new TypeError('The updated user response is invalid.');
      }

      replaceUser(updatedUser);
      setActionFeedback({ type: 'success', message: result.message });
    } catch (error) {
      setActionFeedback({
        type: 'error',
        message:
          error instanceof TypeError
            ? 'The account was updated, but its latest record could not be loaded.'
            : getApiErrorMessage(error),
      });
    } finally {
      setActiveAction('');
    }
  }

  function openDeleteConfirmation(resourceType, record) {
    setActionFeedback(null);
    setConfirmationError('');
    setConfirmation({ resourceType, record });
  }

  function closeDeleteConfirmation() {
    if (!activeAction) {
      setConfirmation(null);
      setConfirmationError('');
    }
  }

  async function handleConfirmDelete() {
    if (!confirmation) {
      return;
    }

    const { resourceType, record } = confirmation;
    setConfirmationError('');
    setActiveAction(`delete-${resourceType}-${record.id}`);

    try {
      if (resourceType === 'user') {
        const result = await deleteAdminUser(record.id);

        if (Number(result.data?.userId) !== Number(record.id)) {
          throw new TypeError('The deleted user response is invalid.');
        }

        setUsers((currentUsers) =>
          currentUsers.filter((user) => Number(user.id) !== Number(record.id)),
        );
        setDashboard((currentDashboard) => {
          if (!currentDashboard) {
            return currentDashboard;
          }

          const roleStatistic =
            record.role === 'owner'
              ? 'totalOwners'
              : record.role === 'tenant'
                ? 'totalTenants'
                : null;
          const statistics = {
            ...currentDashboard.statistics,
            totalUsers: Math.max(0, currentDashboard.statistics.totalUsers - 1),
          };

          if (roleStatistic) {
            statistics[roleStatistic] = Math.max(
              0,
              currentDashboard.statistics[roleStatistic] - 1,
            );
          }

          return {
            ...currentDashboard,
            statistics,
            recentUsers: currentDashboard.recentUsers.filter(
              (user) => Number(user.id) !== Number(record.id),
            ),
          };
        });
        setActionFeedback({ type: 'success', message: result.message });
      } else {
        const result = await deleteAdminProperty(record.id);

        if (Number(result.data?.propertyId) !== Number(record.id)) {
          throw new TypeError('The deleted property response is invalid.');
        }

        setProperties((currentProperties) =>
          currentProperties.filter(
            (property) => Number(property.id) !== Number(record.id),
          ),
        );
        setDashboard((currentDashboard) =>
          currentDashboard
            ? {
                ...currentDashboard,
                statistics: {
                  ...currentDashboard.statistics,
                  totalProperties: Math.max(
                    0,
                    currentDashboard.statistics.totalProperties - 1,
                  ),
                },
                recentProperties: currentDashboard.recentProperties.filter(
                  (property) => Number(property.id) !== Number(record.id),
                ),
              }
            : currentDashboard,
        );
        setActionFeedback({ type: 'success', message: result.message });
      }

      setConfirmation(null);
    } catch (error) {
      setConfirmationError(
        error instanceof TypeError
          ? 'The action completed, but its confirmation response was invalid.'
          : getApiErrorMessage(error),
      );
    } finally {
      setActiveAction('');
    }
  }

  const admin = dashboard?.admin || currentUser;

  return (
    <div className="page-shell admin-dashboard-page">
      <div className="admin-dashboard-container">
        <AdminMobileNavigation />

        <div className="admin-dashboard-layout">
          <AdminSidebar admin={admin} />

          <div className="admin-dashboard-main">
            <header className="admin-dashboard-header" id="overview">
              <div>
                <span className="admin-dashboard-eyebrow">
                  <i className="bi bi-shield-check" aria-hidden="true" />
                  Administrator workspace
                </span>
                <h1>RentEase Admin Dashboard</h1>
                <p>
                  Manage platform accounts and property inventory while
                  monitoring every rental request from one secure workspace.
                </p>
              </div>
              <div className="admin-dashboard-header-mark" aria-hidden="true">
                <i className="bi bi-speedometer2" />
              </div>
            </header>

            {isLoading && (
              <div className="admin-dashboard-state" aria-live="polite">
                <span className="admin-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-bar-chart-fill" />
                </span>
                <LoadingSpinner label="Loading admin dashboard..." />
                <p>Preparing the latest RentEase platform overview.</p>
              </div>
            )}

            {!isLoading && errorMessage && (
              <div className="admin-dashboard-state is-error" role="alert">
                <span className="admin-dashboard-state-icon" aria-hidden="true">
                  <i className="bi bi-exclamation-triangle-fill" />
                </span>
                <h2>We could not load the admin dashboard</h2>
                <p>{errorMessage}</p>
                <button
                  className="btn btn-brand"
                  onClick={() => setRequestKey((currentKey) => currentKey + 1)}
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading && dashboard && (
              <>
                <div className="admin-dashboard-success" role="status">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  Dashboard data is up to date
                </div>

                {actionFeedback && (
                  <div
                    className={`admin-action-feedback is-${actionFeedback.type}`}
                    role={actionFeedback.type === 'error' ? 'alert' : 'status'}
                  >
                    <i
                      className={`bi ${actionFeedback.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`}
                      aria-hidden="true"
                    />
                    <span>{actionFeedback.message}</span>
                    <button
                      aria-label="Dismiss notification"
                      onClick={() => setActionFeedback(null)}
                      type="button"
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <AdminStatCards statistics={dashboard.statistics} />

                <section aria-labelledby="admin-recent-heading">
                  <AdminSectionHeading
                    count="Latest 5"
                    eyebrow="Platform activity"
                    id="admin-recent-heading"
                    title="Recent Activity"
                  />
                  <AdminRecentPanels
                    properties={dashboard.recentProperties}
                    rentalRequests={dashboard.recentRequests}
                    users={dashboard.recentUsers}
                  />
                </section>

                <section
                  className="admin-data-section"
                  id="users"
                  aria-labelledby="admin-users-heading"
                >
                  <AdminSectionHeading
                    count={`${filteredUsers.length} users`}
                    eyebrow="Account directory"
                    id="admin-users-heading"
                    title="All Users"
                  />
                  <AdminFilterToolbar
                    filters={[
                      {
                        id: 'admin-user-role',
                        label: 'Role',
                        onChange: setUserRole,
                        options: USER_ROLE_OPTIONS,
                        value: userRole,
                      },
                      {
                        id: 'admin-account-status',
                        label: 'Account status',
                        onChange: setAccountStatus,
                        options: ACCOUNT_STATUS_OPTIONS,
                        value: accountStatus,
                      },
                    ]}
                    idPrefix="admin-users"
                    onClear={() => {
                      setUserSearch('');
                      setUserRole('all');
                      setAccountStatus('all');
                    }}
                    onSearchChange={setUserSearch}
                    resultCount={filteredUsers.length}
                    searchPlaceholder="Search name, email, phone, or role"
                    searchTerm={userSearch}
                    totalCount={users.length}
                  />
                  <AdminUsersTable
                    activeAction={activeAction}
                    currentAdminId={admin.id}
                    onChangeStatus={handleUserStatusChange}
                    onDelete={(user) => openDeleteConfirmation('user', user)}
                    onViewDetails={(user) =>
                      setDetails({ resourceType: 'user', record: user })
                    }
                    users={filteredUsers}
                  />
                </section>

                <section
                  className="admin-data-section"
                  id="properties"
                  aria-labelledby="admin-properties-heading"
                >
                  <AdminSectionHeading
                    count={`${filteredProperties.length} properties`}
                    eyebrow="Property inventory"
                    id="admin-properties-heading"
                    title="All Properties"
                  />
                  <AdminFilterToolbar
                    filters={[
                      {
                        id: 'admin-property-type',
                        label: 'Property type',
                        onChange: setPropertyType,
                        options: PROPERTY_TYPE_OPTIONS,
                        value: propertyType,
                      },
                      {
                        id: 'admin-property-availability',
                        label: 'Availability',
                        onChange: setAvailabilityStatus,
                        options: AVAILABILITY_OPTIONS,
                        value: availabilityStatus,
                      },
                      {
                        id: 'admin-property-approval',
                        label: 'Approval',
                        onChange: setApprovalStatus,
                        options: APPROVAL_OPTIONS,
                        value: approvalStatus,
                      },
                    ]}
                    idPrefix="admin-properties"
                    onClear={() => {
                      setPropertySearch('');
                      setPropertyType('all');
                      setAvailabilityStatus('all');
                      setApprovalStatus('all');
                    }}
                    onSearchChange={setPropertySearch}
                    resultCount={filteredProperties.length}
                    searchPlaceholder="Search property, owner, city, or address"
                    searchTerm={propertySearch}
                    totalCount={properties.length}
                  />
                  <AdminPropertiesTable
                    activeAction={activeAction}
                    onDelete={(property) =>
                      openDeleteConfirmation('property', property)
                    }
                    onViewDetails={(property) =>
                      setDetails({ resourceType: 'property', record: property })
                    }
                    properties={filteredProperties}
                  />
                </section>

                <section
                  className="admin-data-section"
                  id="requests"
                  aria-labelledby="admin-requests-heading"
                >
                  <AdminSectionHeading
                    count={`${filteredRentalRequests.length} requests`}
                    eyebrow="Rental activity"
                    id="admin-requests-heading"
                    title="All Rental Requests"
                  />
                  <AdminFilterToolbar
                    filters={[
                      {
                        id: 'admin-request-status',
                        label: 'Request status',
                        onChange: setRequestStatus,
                        options: RENTAL_REQUEST_STATUS_OPTIONS,
                        value: requestStatus,
                      },
                    ]}
                    idPrefix="admin-requests"
                    onClear={() => {
                      setRequestSearch('');
                      setRequestStatus('all');
                    }}
                    onSearchChange={setRequestSearch}
                    resultCount={filteredRentalRequests.length}
                    searchPlaceholder="Search property, tenant, owner, or message"
                    searchTerm={requestSearch}
                    totalCount={rentalRequests.length}
                  />
                  <AdminRentalRequestsTable
                    onViewDetails={(rentalRequest) =>
                      setDetails({
                        resourceType: 'rentalRequest',
                        record: rentalRequest,
                      })
                    }
                    rentalRequests={filteredRentalRequests}
                  />
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {details && (
        <AdminDetailsModal
          onClose={() => setDetails(null)}
          record={details.record}
          resourceType={details.resourceType}
        />
      )}

      {confirmation && (
        <AdminConfirmationModal
          cancelLabel={
            confirmation.resourceType === 'user' ? 'Keep User' : 'Keep Property'
          }
          confirmLabel={
            confirmation.resourceType === 'user' ? 'Delete User' : 'Delete Property'
          }
          errorMessage={confirmationError}
          isProcessing={activeAction.startsWith('delete-')}
          message={
            confirmation.resourceType === 'user' ? (
              <p>
                Permanently delete <strong>{confirmation.record.fullName}</strong>?
                This removes the account and cannot be undone.
              </p>
            ) : (
              <p>
                Permanently remove <strong>{confirmation.record.title}</strong>?
                It will disappear from the owner portfolio and public listings.
              </p>
            )
          }
          onCancel={closeDeleteConfirmation}
          onConfirm={handleConfirmDelete}
          title={
            confirmation.resourceType === 'user'
              ? 'Delete user account?'
              : 'Delete property listing?'
          }
        />
      )}
    </div>
  );
}

export default AdminDashboard;
