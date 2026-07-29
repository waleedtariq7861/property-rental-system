import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import { getOwnerDashboard } from '../services/ownerDashboardService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  getRoleTest: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock('../services/ownerDashboardService.js', () => ({
  getOwnerDashboard: vi.fn(),
}));

const ownerUser = {
  id: 302,
  fullName: 'Amina Siddiqui',
  email: 'amina.owner@example.test',
  role: 'owner',
};

const tenantUser = {
  id: 303,
  fullName: 'Hassan Tenant',
  email: 'hassan.tenant@example.test',
  role: 'tenant',
};

const ownerProperties = [
  {
    id: 51,
    ownerId: ownerUser.id,
    title: 'Modern Apartment in E-11',
    price: 92000,
    city: 'Islamabad',
    propertyType: 'apartment',
    imageUrl: 'https://example.test/owner-apartment.jpg',
    availabilityStatus: 'available',
    approvalStatus: 'approved',
    currentStatus: 'active',
    createdAt: '2026-07-25T08:00:00.000Z',
  },
  {
    id: 52,
    ownerId: ownerUser.id,
    title: 'Family Home in Bahria Town',
    price: 145000,
    city: 'Rawalpindi',
    propertyType: 'house',
    imageUrl: null,
    availabilityStatus: 'available',
    approvalStatus: 'pending',
    currentStatus: 'pending',
    createdAt: '2026-07-20T08:00:00.000Z',
  },
];

function dashboardResponse(overrides = {}) {
  return {
    success: true,
    data: {
      owner: ownerUser,
      statistics: {
        totalProperties: 2,
        activeListings: 1,
        recentlyAddedProperties: 1,
      },
      properties: ownerProperties,
      ...overrides,
    },
  };
}

function renderApp(path = '/owner/dashboard', user = ownerUser) {
  saveStoredAuth({
    token: `dashboard-token-${user.id}`,
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

describe('Owner dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the reusable loading state while dashboard data is pending', async () => {
    getOwnerDashboard.mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(
      await screen.findByText('Loading your dashboard...'),
    ).toBeInTheDocument();
    expect(getOwnerDashboard).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('renders the owner welcome, live statistics, navigation, and owned properties', async () => {
    getOwnerDashboard.mockResolvedValue(dashboardResponse());

    renderApp();

    expect(
      await screen.findByRole('heading', {
        name: `Welcome back, ${ownerUser.fullName}`,
      }),
    ).toBeInTheDocument();

    const totalCard = (await screen.findByText('Total Properties')).closest(
      'article',
    );
    const activeCard = screen.getByText('Active Listings').closest('article');
    const recentCard = screen.getByText('Recently Added').closest('article');

    expect(within(totalCard).getByText('2')).toBeInTheDocument();
    expect(within(activeCard).getByText('1')).toBeInTheDocument();
    expect(within(recentCard).getByText('1')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'My Properties' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: ownerProperties[0].title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: ownerProperties[1].title }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 92,000')).toBeInTheDocument();
    expect(screen.getByText('25 July 2026')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getAllByText('Pending Review')).toHaveLength(2);
    expect(screen.getAllByRole('navigation', { name: 'Owner dashboard' }))
      .toHaveLength(2);
  });

  it('shows the owner-specific empty state when no properties exist', async () => {
    getOwnerDashboard.mockResolvedValue(
      dashboardResponse({
        statistics: {
          totalProperties: 0,
          activeListings: 0,
          recentlyAddedProperties: 0,
        },
        properties: [],
      }),
    );

    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'No properties yet' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 properties')).toBeInTheDocument();
  });

  it('shows an API error and can retry the dashboard request', async () => {
    const user = userEvent.setup();
    getOwnerDashboard
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'Owner dashboard is temporarily unavailable.',
          },
        },
      })
      .mockResolvedValueOnce(dashboardResponse());

    renderApp();

    expect(
      await screen.findByText('Owner dashboard is temporarily unavailable.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'My Properties' }),
    ).toBeInTheDocument();
    expect(getOwnerDashboard).toHaveBeenCalledTimes(2);
  });

  it('redirects a non-owner to Access Denied before requesting dashboard data', async () => {
    renderApp('/owner/dashboard', tenantUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(getOwnerDashboard).not.toHaveBeenCalled());
  });
});
