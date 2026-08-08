import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import {
  deleteAdminProperty,
  deleteAdminUser,
  getAdminDashboard,
  getAdminProperties,
  getAdminRentalRequests,
  getAdminUsers,
  updateAdminUserStatus,
} from '../services/adminDashboardService.js';
import { getAuthenticatedProfile } from '../services/authService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/adminDashboardService.js', () => ({
  deleteAdminProperty: vi.fn(),
  deleteAdminUser: vi.fn(),
  getAdminDashboard: vi.fn(),
  getAdminProperties: vi.fn(),
  getAdminRentalRequests: vi.fn(),
  getAdminUsers: vi.fn(),
  updateAdminUserStatus: vi.fn(),
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
    propertyCount: 0,
    rentalRequestCount: 0,
    createdAt: '2026-08-04T10:00:00.000Z',
    updatedAt: '2026-08-04T10:00:00.000Z',
  },
  {
    ...ownerUser,
    phone: '+92-300-0001002',
    accountStatus: 'active',
    propertyCount: 2,
    rentalRequestCount: 2,
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
    propertyCount: 0,
    rentalRequestCount: 2,
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
    rentalRequestCount: 1,
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
    rentalRequestCount: 1,
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

  it('renders statistics, recent activity, detailed data views, and Day 5 actions', async () => {
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
    expect(within(requestsSection).getByText('Accepted', {
      selector: '.admin-status-badge',
    })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Maham Tenant' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate Maham Tenant' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Maham Tenant' }))
      .toBeDisabled();
    expect(screen.getByRole('button', {
      name: 'View rental request 701',
    })).toBeInTheDocument();
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

  it('activates and deactivates accounts while keeping the directory in sync', async () => {
    const user = userEvent.setup();
    const updatedOwner = {
      ...users[1],
      accountStatus: 'deactivated',
      updatedAt: '2026-08-05T10:00:00.000Z',
    };
    updateAdminUserStatus.mockResolvedValue({
      success: true,
      message: 'User account deactivated successfully.',
      data: { user: updatedOwner },
    });

    renderApp();

    await user.click(await screen.findByRole('button', {
      name: 'Deactivate Omar Property Owner',
    }));

    expect(updateAdminUserStatus).toHaveBeenCalledWith(ownerUser.id, 'deactivated');
    expect(await screen.findByText('User account deactivated successfully.'))
      .toBeInTheDocument();
    const usersSection = screen.getByRole('heading', { name: 'All Users' })
      .closest('section');
    const ownerRow = within(usersSection)
      .getByText('Omar Property Owner')
      .closest('tr');
    expect(within(ownerRow).getByText('Deactivated')).toBeInTheDocument();
    expect(within(ownerRow).getByRole('button', {
      name: 'Activate Omar Property Owner',
    })).toBeInTheDocument();
  });

  it('confirms and deletes an eligible user while updating dashboard totals', async () => {
    const user = userEvent.setup();
    const deletableUser = {
      id: 1004,
      fullName: 'Hiba New Tenant',
      email: 'hiba.tenant@example.test',
      phone: null,
      role: 'tenant',
      accountStatus: 'active',
      propertyCount: 0,
      rentalRequestCount: 0,
      createdAt: '2026-08-05T08:00:00.000Z',
      updatedAt: '2026-08-05T08:00:00.000Z',
    };
    getAdminUsers.mockResolvedValue(
      listResponse('users', [...users, deletableUser]),
    );
    deleteAdminUser.mockResolvedValue({
      success: true,
      message: 'User deleted successfully.',
      data: { userId: deletableUser.id },
    });

    renderApp();

    await user.click(await screen.findByRole('button', {
      name: 'Delete Hiba New Tenant',
    }));
    const confirmation = screen.getByRole('dialog', {
      name: 'Delete user account?',
    });
    expect(within(confirmation).getByText('Hiba New Tenant')).toBeInTheDocument();
    expect(deleteAdminUser).not.toHaveBeenCalled();

    await user.click(within(confirmation).getByRole('button', {
      name: 'Delete User',
    }));

    expect(deleteAdminUser).toHaveBeenCalledWith(deletableUser.id);
    expect(await screen.findByText('User deleted successfully.'))
      .toBeInTheDocument();
    expect(screen.queryByText('Hiba New Tenant')).not.toBeInTheDocument();
    const totalUsersCard = screen.getByText('Total Users').closest('article');
    expect(within(totalUsersCard).getByText('2')).toBeInTheDocument();
  });

  it('confirms property removal and keeps server errors inside the dialog', async () => {
    const user = userEvent.setup();
    const removableProperty = {
      ...properties[0],
      id: 503,
      title: 'Unreviewed Studio Listing',
      propertyType: 'studio',
      rentalRequestCount: 0,
    };
    getAdminProperties.mockResolvedValue(
      listResponse('properties', [...properties, removableProperty]),
    );
    deleteAdminProperty
      .mockRejectedValueOnce({
        response: {
          data: { message: 'Property removal could not be completed.' },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'Property removed successfully.',
        data: { propertyId: removableProperty.id },
      });

    renderApp();

    await user.click(await screen.findByRole('button', {
      name: 'Delete Unreviewed Studio Listing',
    }));
    let confirmation = screen.getByRole('dialog', {
      name: 'Delete property listing?',
    });
    await user.click(within(confirmation).getByRole('button', {
      name: 'Delete Property',
    }));

    expect(await within(confirmation).findByText(
      'Property removal could not be completed.',
    )).toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Delete Unreviewed Studio Listing',
    })).toBeInTheDocument();

    await user.click(within(confirmation).getByRole('button', {
      name: 'Delete Property',
    }));

    expect(deleteAdminProperty).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('Property removed successfully.'))
      .toBeInTheDocument();
    expect(screen.queryByText('Unreviewed Studio Listing')).not.toBeInTheDocument();
  });

  it('shows complete record dialogs and filters rental request monitoring', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', {
      name: 'View Maham Tenant',
    }));
    const userDialog = screen.getByRole('dialog', { name: 'User details' });
    expect(within(userDialog).getByText('maham.tenant@example.test'))
      .toBeInTheDocument();
    expect(within(userDialog).getByText('2', { selector: 'dd' }))
      .toBeInTheDocument();
    await user.click(within(userDialog).getByRole('button', {
      name: 'Close details',
    }));

    await user.click(screen.getByRole('button', {
      name: 'View Executive Apartment in F-10',
    }));
    const propertyDialog = screen.getByRole('dialog', {
      name: 'Property details',
    });
    expect(within(propertyDialog).getByText(
      'A furnished apartment near the city centre.',
    )).toBeInTheDocument();
    expect(within(propertyDialog).getByText('+92-300-0001002'))
      .toBeInTheDocument();
    await user.click(within(propertyDialog).getByRole('button', {
      name: 'Close details',
    }));

    const requestsSection = screen
      .getByRole('heading', { name: 'All Rental Requests' })
      .closest('section');
    await user.selectOptions(
      within(requestsSection).getByRole('combobox', { name: 'Request status' }),
      'approved',
    );
    expect(within(requestsSection).getByText('Showing 1 of 2'))
      .toBeInTheDocument();
    expect(within(requestsSection).getByText('Family House in Bahria Town'))
      .toBeInTheDocument();
    expect(within(requestsSection).queryByText('Executive Apartment in F-10'))
      .not.toBeInTheDocument();

    await user.click(within(requestsSection).getByRole('button', {
      name: 'View rental request 702',
    }));
    const requestDialog = screen.getByRole('dialog', {
      name: 'Rental request details',
    });
    expect(within(requestDialog).getByText('#702')).toBeInTheDocument();
    expect(within(requestDialog).getByText('Accepted')).toBeInTheDocument();
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
      expect(updateAdminUserStatus).not.toHaveBeenCalled();
      expect(deleteAdminUser).not.toHaveBeenCalled();
      expect(deleteAdminProperty).not.toHaveBeenCalled();
    });
  });
});
