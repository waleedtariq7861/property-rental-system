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
import AdminFilterToolbar from '../components/AdminFilterToolbar.jsx';
import AdminRecentPanels from '../components/AdminRecentPanels.jsx';
import AdminStatCards from '../components/AdminStatCards.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAdminDashboard,
  getAdminProperties,
  getAdminRentalRequests,
  getAdminUsers,
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
                  Monitor platform accounts, property inventory, and rental
                  request activity from one secure overview.
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
                  <AdminUsersTable users={filteredUsers} />
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
                  <AdminPropertiesTable properties={filteredProperties} />
                </section>

                <section
                  className="admin-data-section"
                  id="requests"
                  aria-labelledby="admin-requests-heading"
                >
                  <AdminSectionHeading
                    count={`${rentalRequests.length} requests`}
                    eyebrow="Rental activity"
                    id="admin-requests-heading"
                    title="All Rental Requests"
                  />
                  <AdminRentalRequestsTable rentalRequests={rentalRequests} />
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
