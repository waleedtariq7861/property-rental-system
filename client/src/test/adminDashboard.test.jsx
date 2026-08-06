import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import {
  getAdminDashboard,
  getAdminProperties,
  getAdminRentalRequests,
  getAdminUsers,
} from '../services/adminDashboardService.js';
import { getAuthenticatedProfile } from '../services/authService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/adminDashboardService.js', () => ({
  getAdminDashboard: vi.fn(),
  getAdminProperties: vi.fn(),
  getAdminRentalRequests: vi.fn(),
  getAdminUsers: vi.fn(),
}));

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  getRoleTest: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

const adminUser = {
  id: 1001,
  fullName: 'Amina Administrator',
  email: 'amina.admin@example.test',
  role: 'admin',
};

const ownerUser = {
  id: 1002,
  fullName: 'Omar Property Owner',
  email: 'omar.owner@example.test',
  role: 'owner',
};

const users = [
  {
    ...adminUser,
    phone: '+92-300-0001001',
    accountStatus: 'active',
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: '2026-08-04T10:00:00.000Z',
  },
  {
    ...ownerUser,
    phone: '+92-300-0001002',
    accountStatus: 'active',
    createdAt: '2026-08-03T09:00:00.000Z',
    updatedAt: '2026-08-03T09:00:00.000Z',
  },
  {
    id: 1003,
    fullName: 'Maham Tenant',
    email: 'maham.tenant@example.test',
    phone: null,
    role: 'tenant',
    accountStatus: 'pending',
    createdAt: '2026-08-02T08:00:00.000Z',
    updatedAt: '2026-08-02T08:00:00.000Z',
  },
];

const properties = [
  {
    id: 501,
    ownerId: ownerUser.id,
    ownerName: ownerUser.fullName,
    ownerEmail: ownerUser.email,
    title: 'Executive Apartment in F-10',
    description: 'A furnished apartment near the city centre.',
    propertyType: 'apartment',
    propertyCategory: 'residential',
    price: '98000.00',
    securityDeposit: '196000.00',
    city: 'Islamabad',
    area: 'F-10',
    address: 'Street 16, F-10, Islamabad',
    bedrooms: 2,
    bathrooms: '2.0',
    propertySize: '1250.00',
    sizeUnit: 'sq_ft',
    furnishedStatus: 'furnished',
    parkingAvailable: 1,
    availabilityStatus: 'available',
    approvalStatus: 'approved',
    imageUrl: null,
    contactNumber: '+92-300-0001002',
    createdAt: '2026-08-04T11:00:00.000Z',
    updatedAt: '2026-08-04T11:00:00.000Z',
  },
  {
    id: 502,
    ownerId: ownerUser.id,
    ownerName: ownerUser.fullName,
    ownerEmail: ownerUser.email,
    title: 'Family House in Bahria Town',
    description: 'A spacious family house.',
    propertyType: 'house',
    propertyCategory: 'residential',
    price: '155000.00',
    securityDeposit: '0.00',
    city: 'Rawalpindi',
    area: 'Bahria Town',
    address: 'Phase 7, Bahria Town, Rawalpindi',
    bedrooms: 4,
    bathrooms: '3.0',
    propertySize: null,
    sizeUnit: 'sq_ft',
    furnishedStatus: 'unfurnished',
    parkingAvailable: 1,
    availabilityStatus: 'rented',
    approvalStatus: 'approved',
    imageUrl: null,
    contactNumber: null,
    createdAt: '2026-08-01T11:00:00.000Z',
    updatedAt: '2026-08-01T11:00:00.000Z',
  },
];

const rentalRequests = [
  {
    id: 701,
    propertyId: properties[0].id,
    tenantId: users[2].id,
    ownerId: ownerUser.id,
    status: 'pending',
    message: 'Please arrange a viewing this weekend.',
    createdAt: '2026-08-04T12:00:00.000Z',
    updatedAt: '2026-08-04T12:00:00.000Z',
    propertyTitle: properties[0].title,
    propertyCity: properties[0].city,
    propertyPrice: properties[0].price,
    propertyType: properties[0].propertyType,
    tenantName: users[2].fullName,
    tenantEmail: users[2].email,
    ownerName: ownerUser.fullName,
    ownerEmail: ownerUser.email,
  },
  {
    id: 702,
    propertyId: properties[1].id,
    tenantId: users[2].id,
    ownerId: ownerUser.id,
    status: 'approved',
    message: null,
    createdAt: '2026-08-02T12:00:00.000Z',
    updatedAt: '2026-08-03T12:00:00.000Z',
    propertyTitle: properties[1].title,
    propertyCity: properties[1].city,
    propertyPrice: properties[1].price,
    propertyType: properties[1].propertyType,
    tenantName: users[2].fullName,
    tenantEmail: users[2].email,
    ownerName: ownerUser.fullName,
    ownerEmail: ownerUser.email,
  },
];

function dashboardResponse(overrides = {}) {
  return {
    success: true,
    data: {
      admin: adminUser,
      statistics: {
        totalUsers: users.length,
        totalOwners: 1,
        totalTenants: 1,
        totalProperties: properties.length,
        totalRentalRequests: rentalRequests.length,
      },
      recentUsers: users,
      recentProperties: properties,
      recentRequests: rentalRequests,
      ...overrides,
    },
  };
}

function listResponse(field, records) {
  return {
    success: true,
    data: { [field]: records, count: records.length },
  };
}

function renderApp(path = '/admin/dashboard', user = adminUser) {
  saveStoredAuth({
    token: `admin-dashboard-token-${user.id}`,
    user,
  });
  getAuthenticatedProfile.mockResolvedValue({
    success: true,
    data: { user },
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Admin dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAdminDashboard.mockResolvedValue(dashboardResponse());
    getAdminUsers.mockResolvedValue(listResponse('users', users));
    getAdminProperties.mockResolvedValue(
      listResponse('properties', properties),
    );
    getAdminRentalRequests.mockResolvedValue(
      listResponse('rentalRequests', rentalRequests),
    );
  });

  it('shows a loading state while all admin data is being fetched', async () => {
    getAdminDashboard.mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(
      await screen.findByText('Loading admin dashboard...'),
    ).toBeInTheDocument();
    expect(getAdminUsers).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(getAdminProperties).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(getAdminRentalRequests).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('renders statistics, recent activity, all data views, and no Day 5 actions', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'RentEase Admin Dashboard' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Dashboard data is up to date'))
      .toBeInTheDocument();

    const statistics = screen.getByRole('region', {
      name: 'Admin dashboard statistics',
    });
    expect(
      within(within(statistics).getByText('Total Users').closest('article'))
        .getByText('3'),
    ).toBeInTheDocument();
    expect(
      within(within(statistics).getByText('Total Properties').closest('article'))
        .getByText('2'),
    ).toBeInTheDocument();
    expect(
      within(within(statistics).getByText('Rental Requests').closest('article'))
        .getByText('2'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Recent Users' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent Properties' }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent Requests' }))
      .toBeInTheDocument();

    const usersSection = screen.getByRole('heading', { name: 'All Users' })
      .closest('section');
    expect(within(usersSection).getByText('Maham Tenant')).toBeInTheDocument();
    expect(within(usersSection).getByText('maham.tenant@example.test'))
      .toBeInTheDocument();

    const propertiesSection = screen
      .getByRole('heading', { name: 'All Properties' })
      .closest('section');
    expect(within(propertiesSection).getByText('Executive Apartment in F-10'))
      .toBeInTheDocument();
    expect(within(propertiesSection).getByText('PKR 98,000'))
      .toBeInTheDocument();

    const requestsSection = screen
      .getByRole('heading', { name: 'All Rental Requests' })
      .closest('section');
    expect(within(requestsSection).getByText('Please arrange a viewing this weekend.'))
      .toBeInTheDocument();
    expect(within(requestsSection).getByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /approve|reject|suspend/i }))
      .not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
  });

  it('searches and filters users entirely within the loaded directory', async () => {
    const user = userEvent.setup();
    renderApp();

    const usersSection = (await screen.findByRole('heading', {
      name: 'All Users',
    })).closest('section');
    const searchInput = within(usersSection).getByRole('searchbox', {
      name: 'Search',
    });

    await user.type(searchInput, 'maham.tenant');
    expect(within(usersSection).getByText('Maham Tenant')).toBeInTheDocument();
    expect(within(usersSection).queryByText('Omar Property Owner'))
      .not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.selectOptions(
      within(usersSection).getByRole('combobox', { name: 'Role' }),
      'owner',
    );
    expect(within(usersSection).getByText('Showing 1 of 3')).toBeInTheDocument();
    expect(within(usersSection).getByText('Omar Property Owner'))
      .toBeInTheDocument();
    expect(within(usersSection).queryByText('Maham Tenant'))
      .not.toBeInTheDocument();

    await user.selectOptions(
      within(usersSection).getByRole('combobox', { name: 'Account status' }),
      'pending',
    );
    expect(within(usersSection).getByText('No users match the selected criteria.'))
      .toBeInTheDocument();

    await user.click(within(usersSection).getByRole('button', {
      name: 'Clear filters',
    }));
    expect(within(usersSection).getByText('Amina Administrator'))
      .toBeInTheDocument();
    expect(getAdminUsers).toHaveBeenCalledTimes(1);
  });

  it('searches and combines property type, availability, and approval filters', async () => {
    const user = userEvent.setup();
    renderApp();

    const propertiesSection = (await screen.findByRole('heading', {
      name: 'All Properties',
    })).closest('section');
    const searchInput = within(propertiesSection).getByRole('searchbox', {
      name: 'Search',
    });

    await user.type(searchInput, 'Rawalpindi');
    expect(within(propertiesSection).getByText('Family House in Bahria Town'))
      .toBeInTheDocument();
    expect(within(propertiesSection).queryByText('Executive Apartment in F-10'))
      .not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.selectOptions(
      within(propertiesSection).getByRole('combobox', { name: 'Property type' }),
      'apartment',
    );
    await user.selectOptions(
      within(propertiesSection).getByRole('combobox', { name: 'Availability' }),
      'available',
    );
    await user.selectOptions(
      within(propertiesSection).getByRole('combobox', { name: 'Approval' }),
      'approved',
    );
    expect(within(propertiesSection).getByText('Showing 1 of 2'))
      .toBeInTheDocument();
    expect(within(propertiesSection).getByText('Executive Apartment in F-10'))
      .toBeInTheDocument();
    expect(within(propertiesSection).queryByText('Family House in Bahria Town'))
      .not.toBeInTheDocument();
    expect(getAdminProperties).toHaveBeenCalledTimes(1);
  });

  it('shows an API error, retries all requests, and renders empty states', async () => {
    const user = userEvent.setup();
    getAdminDashboard
      .mockRejectedValueOnce({
        response: {
          data: { message: 'Admin reporting is temporarily unavailable.' },
        },
      })
      .mockResolvedValueOnce(
        dashboardResponse({
          statistics: {
            totalUsers: 0,
            totalOwners: 0,
            totalTenants: 0,
            totalProperties: 0,
            totalRentalRequests: 0,
          },
          recentUsers: [],
          recentProperties: [],
          recentRequests: [],
        }),
      );
    getAdminUsers.mockResolvedValue(listResponse('users', []));
    getAdminProperties.mockResolvedValue(listResponse('properties', []));
    getAdminRentalRequests.mockResolvedValue(
      listResponse('rentalRequests', []),
    );

    renderApp();

    expect(
      await screen.findByText('Admin reporting is temporarily unavailable.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('No recent users to display.'))
      .toBeInTheDocument();
    expect(screen.getByText('No recent properties to display.'))
      .toBeInTheDocument();
    expect(screen.getByText('No recent requests to display.'))
      .toBeInTheDocument();
    expect(screen.getByText('No users match the selected criteria.'))
      .toBeInTheDocument();
    expect(screen.getByText('No properties match the selected criteria.'))
      .toBeInTheDocument();
    expect(screen.getByText('No rental requests are available.'))
      .toBeInTheDocument();
    expect(getAdminDashboard).toHaveBeenCalledTimes(2);
    expect(getAdminUsers).toHaveBeenCalledTimes(2);
    expect(getAdminProperties).toHaveBeenCalledTimes(2);
    expect(getAdminRentalRequests).toHaveBeenCalledTimes(2);
  });

  it('redirects non-admin users before any admin API is requested', async () => {
    renderApp('/admin/dashboard', ownerUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(getAdminDashboard).not.toHaveBeenCalled();
      expect(getAdminUsers).not.toHaveBeenCalled();
      expect(getAdminProperties).not.toHaveBeenCalled();
      expect(getAdminRentalRequests).not.toHaveBeenCalled();
    });
  });
});
