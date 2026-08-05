import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import {
  cancelRentalRequest,
  getMyRentalRequests,
} from '../services/rentalRequestService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  getRoleTest: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock('../services/rentalRequestService.js', () => ({
  cancelRentalRequest: vi.fn(),
  createRentalRequest: vi.fn(),
  getMyRentalRequests: vi.fn(),
  getOwnerRentalRequests: vi.fn(),
  updateOwnerRentalRequestStatus: vi.fn(),
}));

const tenantUser = {
  id: 901,
  fullName: 'Areeba Tenant',
  email: 'areeba.tenant@example.test',
  role: 'tenant',
};

const ownerUser = {
  id: 902,
  fullName: 'Usman Property Owner',
  email: 'usman.owner@example.test',
  role: 'owner',
};

const rentalRequests = [
  {
    id: 401,
    propertyId: 101,
    tenantId: tenantUser.id,
    ownerId: 920,
    status: 'pending',
    message: 'I would like to visit this apartment on Saturday.',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
    propertyTitle: 'Bright Apartment in E-11',
    propertyCity: 'Islamabad',
    propertyPrice: '82000.00',
    propertyType: 'apartment',
    propertyImageUrl: 'https://example.test/bright-apartment.jpg',
    ownerName: 'Noman Malik',
  },
  {
    id: 402,
    propertyId: 102,
    tenantId: tenantUser.id,
    ownerId: 921,
    status: 'approved',
    message: 'A twelve-month lease would be ideal.',
    createdAt: '2026-08-02T09:00:00.000Z',
    updatedAt: '2026-08-02T12:00:00.000Z',
    propertyTitle: 'Family House in Bahria Town',
    propertyCity: 'Rawalpindi',
    propertyPrice: '135000.00',
    propertyType: 'house',
    propertyImageUrl: null,
    ownerName: 'Saba Ahmed',
  },
  {
    id: 403,
    propertyId: 103,
    tenantId: tenantUser.id,
    ownerId: 922,
    status: 'rejected',
    message: null,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T11:00:00.000Z',
    propertyTitle: 'Studio Near Blue Area',
    propertyCity: 'Islamabad',
    propertyPrice: '55000.00',
    propertyType: 'studio',
    propertyImageUrl: null,
    ownerName: 'Ali Raza',
  },
  {
    id: 404,
    propertyId: 104,
    tenantId: tenantUser.id,
    ownerId: 923,
    status: 'cancelled',
    message: 'Previously cancelled request.',
    createdAt: '2026-07-30T08:00:00.000Z',
    updatedAt: '2026-07-30T09:00:00.000Z',
    propertyTitle: 'Garden Portion in F-8',
    propertyCity: 'Islamabad',
    propertyPrice: '70000.00',
    propertyType: 'portion',
    propertyImageUrl: null,
    ownerName: 'Fatima Noor',
  },
];

function dashboardResponse(requests = rentalRequests) {
  return {
    success: true,
    data: {
      rentalRequests: requests,
      count: requests.length,
    },
  };
}

function renderApp(path = '/tenant/dashboard', user = tenantUser) {
  saveStoredAuth({
    token: `tenant-dashboard-token-${user.id}`,
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

describe('Tenant dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyRentalRequests.mockResolvedValue(dashboardResponse());
  });

  it('shows a loading state while the tenant requests are being fetched', async () => {
    getMyRentalRequests.mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(
      await screen.findByText('Loading your rental dashboard...'),
    ).toBeInTheDocument();
    expect(getMyRentalRequests).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('renders request summaries, property details, and mapped statuses', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', {
        name: `Welcome, ${tenantUser.fullName}`,
      }),
    ).toBeInTheDocument();

    const summary = await screen.findByRole('region', {
      name: 'Rental request summary',
    });
    const totalCard = within(summary).getByText('Total Requests').closest('article');
    const pendingCard = within(summary).getByText('Pending')
      .closest('article');
    const acceptedCard = within(summary).getByText('Accepted')
      .closest('article');
    const rejectedCard = within(summary).getByText('Rejected')
      .closest('article');

    expect(within(totalCard).getByText('4')).toBeInTheDocument();
    expect(within(pendingCard).getByText('1')).toBeInTheDocument();
    expect(within(acceptedCard).getByText('1')).toBeInTheDocument();
    expect(within(rejectedCard).getByText('1')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Bright Apartment in E-11' }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 82,000')).toBeInTheDocument();
    expect(screen.getByText('Noman Malik')).toBeInTheDocument();
    expect(screen.getAllByText('3 August 2026')).not.toHaveLength(0);
    expect(
      screen.getByText('I would like to visit this apartment on Saturday.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Status: Pending')).toBeInTheDocument();
    expect(screen.getByLabelText('Status: Accepted')).toBeInTheDocument();
    expect(screen.getByLabelText('Status: Rejected')).toBeInTheDocument();
    expect(screen.getByLabelText('Status: Cancelled')).toBeInTheDocument();
    const recentActivity = screen
      .getByRole('heading', { name: 'Recent Activity' })
      .closest('section');
    expect(within(recentActivity).getByText('Request accepted'))
      .toBeInTheDocument();
    expect(within(recentActivity).getByText('Request rejected'))
      .toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/tenant/dashboard',
    );

    const acceptedRequestCard = screen
      .getByRole('heading', { name: 'Family House in Bahria Town' })
      .closest('article');
    expect(
      within(acceptedRequestCard).queryByRole('button', {
        name: 'Cancel Request',
      }),
    ).not.toBeInTheDocument();
  });

  it('searches and filters tenant requests while keeping summary totals', async () => {
    const user = userEvent.setup();

    renderApp();

    const searchInput = await screen.findByRole('searchbox', {
      name: 'Search requests',
    });
    const statusSelect = screen.getByRole('combobox', {
      name: 'Request status',
    });

    await user.type(searchInput, 'Noman Malik');
    expect(
      screen.getByRole('heading', { name: 'Bright Apartment in E-11' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Family House in Bahria Town' }),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.selectOptions(statusSelect, 'rejected');
    expect(screen.getByText('Showing 1 of 4')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Studio Near Blue Area' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Bright Apartment in E-11' }),
    ).not.toBeInTheDocument();

    const summary = screen.getByRole('region', {
      name: 'Rental request summary',
    });
    const totalCard = within(summary).getByText('Total Requests').closest('article');
    expect(within(totalCard).getByText('4')).toBeInTheDocument();

    await user.type(searchInput, 'no matching property');
    expect(
      screen.getByRole('heading', { name: 'No matching requests' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(
      screen.getByRole('heading', { name: 'Bright Apartment in E-11' }),
    ).toBeInTheDocument();
    expect(getMyRentalRequests).toHaveBeenCalledTimes(1);
  });

  it('shows cancellation progress for a pending request', async () => {
    const user = userEvent.setup();
    cancelRentalRequest.mockReturnValue(new Promise(() => {}));

    renderApp();

    await user.click(
      await screen.findByRole('button', { name: 'Cancel Request' }),
    );

    expect(
      screen.getByRole('button', { name: 'Cancelling...' }),
    ).toBeDisabled();
  });

  it('cancels an owned pending request and refreshes status summaries', async () => {
    const user = userEvent.setup();
    const cancelledRequest = { ...rentalRequests[0], status: 'cancelled' };
    cancelRentalRequest.mockResolvedValue({
      success: true,
      message: 'Rental request cancelled successfully.',
      data: { rentalRequest: cancelledRequest },
    });

    renderApp();

    const requestCard = (
      await screen.findByRole('heading', { name: 'Bright Apartment in E-11' })
    ).closest('article');
    await user.click(
      within(requestCard).getByRole('button', { name: 'Cancel Request' }),
    );

    expect(cancelRentalRequest).toHaveBeenCalledWith(rentalRequests[0].id);
    expect(
      await screen.findByText('Rental request cancelled successfully.'),
    ).toBeInTheDocument();
    expect(within(requestCard).getByLabelText('Status: Cancelled'))
      .toBeInTheDocument();
    expect(
      within(requestCard).queryByRole('button', { name: 'Cancel Request' }),
    ).not.toBeInTheDocument();

    const summary = screen.getByRole('region', {
      name: 'Rental request summary',
    });
    const pendingSummary = within(summary).getByText('Pending')
      .closest('article');
    const totalSummary = within(summary).getByText('Total Requests')
      .closest('article');
    expect(within(pendingSummary).getByText('0')).toBeInTheDocument();
    expect(within(totalSummary).getByText('4')).toBeInTheDocument();
  });

  it('shows cancellation errors and leaves the pending action available', async () => {
    const user = userEvent.setup();
    cancelRentalRequest.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'Rental request cancellation is unavailable.' },
      },
    });

    renderApp();

    const cancelButton = await screen.findByRole('button', {
      name: 'Cancel Request',
    });
    await user.click(cancelButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Rental request cancellation is unavailable.',
    );
    expect(cancelButton).toBeEnabled();
    expect(screen.getByLabelText('Status: Pending')).toBeInTheDocument();
  });

  it('shows a load error, supports retry, and renders the empty state', async () => {
    const user = userEvent.setup();
    getMyRentalRequests
      .mockRejectedValueOnce({
        response: {
          data: { message: 'Tenant dashboard is temporarily unavailable.' },
        },
      })
      .mockResolvedValueOnce(dashboardResponse([]));

    renderApp();

    expect(
      await screen.findByText('Tenant dashboard is temporarily unavailable.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'No rental requests yet' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Browse Properties' }))
      .toHaveLength(2);
    expect(getMyRentalRequests).toHaveBeenCalledTimes(2);
  });

  it('redirects property owners before requesting tenant dashboard data', async () => {
    renderApp('/tenant/dashboard', ownerUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(getMyRentalRequests).not.toHaveBeenCalled());
  });
});
