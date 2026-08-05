import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import {
  getOwnerRentalRequests,
  updateOwnerRentalRequestStatus,
} from '../services/rentalRequestService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  getRoleTest: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock('../services/rentalRequestService.js', () => ({
  createRentalRequest: vi.fn(),
  getMyRentalRequests: vi.fn(),
  getOwnerRentalRequests: vi.fn(),
  updateOwnerRentalRequestStatus: vi.fn(),
}));

const ownerUser = {
  id: 801,
  fullName: 'Sana Property Owner',
  email: 'sana.owner@example.test',
  role: 'owner',
};

const tenantUser = {
  id: 802,
  fullName: 'Hamza Tenant',
  email: 'hamza.tenant@example.test',
  role: 'tenant',
};

const rentalRequests = [
  {
    id: 301,
    propertyId: 91,
    tenantId: 811,
    ownerId: ownerUser.id,
    tenantName: 'Hira Ahmed',
    tenantEmail: 'hira.ahmed@example.test',
    tenantPhone: '+92 300 1112233',
    propertyTitle: 'Sunny Apartment in F-11',
    propertyCity: 'Islamabad',
    propertyPrice: '92000.00',
    propertyType: 'apartment',
    propertyImageUrl: null,
    message: 'I would like to arrange a viewing this weekend.',
    status: 'pending',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
  },
  {
    id: 302,
    propertyId: 92,
    tenantId: 812,
    ownerId: ownerUser.id,
    tenantName: 'Bilal Khan',
    tenantEmail: 'bilal.khan@example.test',
    tenantPhone: null,
    propertyTitle: 'Family House in Bahria Town',
    propertyCity: 'Rawalpindi',
    propertyPrice: '145000.00',
    propertyType: 'house',
    propertyImageUrl: null,
    message: null,
    status: 'approved',
    createdAt: '2026-08-02T09:00:00.000Z',
    updatedAt: '2026-08-02T11:00:00.000Z',
  },
  {
    id: 303,
    propertyId: 93,
    tenantId: 813,
    ownerId: ownerUser.id,
    tenantName: 'Daniyal Ali',
    tenantEmail: 'daniyal.ali@example.test',
    tenantPhone: '+92 321 9876543',
    propertyTitle: 'Studio Near Blue Area',
    propertyCity: 'Islamabad',
    propertyPrice: '58000.00',
    propertyType: 'studio',
    propertyImageUrl: null,
    message: 'Is a twelve-month lease available?',
    status: 'pending',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
  },
];

function ownerRequestsResponse(requests = rentalRequests) {
  return {
    success: true,
    data: {
      rentalRequests: requests,
      count: requests.length,
    },
  };
}

function renderApp(path = '/owner/requests', user = ownerUser) {
  saveStoredAuth({
    token: `owner-requests-token-${user.id}`,
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

describe('Owner rental requests page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOwnerRentalRequests.mockResolvedValue(ownerRequestsResponse());
  });

  it('shows a loading state while owner requests are being fetched', async () => {
    getOwnerRentalRequests.mockReturnValue(new Promise(() => {}));

    renderApp();

    expect(
      await screen.findByText('Loading rental requests...'),
    ).toBeInTheDocument();
    expect(getOwnerRentalRequests).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('displays tenant, property, date, message, status, and owner navigation', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Rental Requests' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Hira Ahmed' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sunny Apartment in F-11')).toBeInTheDocument();
    expect(screen.getByText('hira.ahmed@example.test')).toBeInTheDocument();
    expect(screen.getByText('+92 300 1112233')).toBeInTheDocument();
    expect(screen.getByText('PKR 92,000')).toBeInTheDocument();
    expect(screen.getByText('3 August 2026')).toBeInTheDocument();
    expect(
      screen.getByText('I would like to arrange a viewing this weekend.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No message was included with this request.'),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Status: Pending')).toHaveLength(2);
    expect(screen.getByLabelText('Status: Accepted')).toBeInTheDocument();
    expect(screen.getByText('3 requests')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Rental Requests' }),
    ).toHaveLength(2);

    const approvedCard = screen
      .getByRole('heading', { name: 'Bilal Khan' })
      .closest('article');
    expect(within(approvedCard).queryByRole('button', { name: 'Accept' }))
      .not.toBeInTheDocument();
    expect(within(approvedCard).queryByRole('button', { name: 'Reject' }))
      .not.toBeInTheDocument();
  });

  it('searches and filters requests without changing the owner-scoped dataset', async () => {
    const user = userEvent.setup();

    renderApp();

    const searchInput = await screen.findByRole('searchbox', {
      name: 'Search requests',
    });
    const statusSelect = screen.getByRole('combobox', {
      name: 'Request status',
    });

    await user.type(searchInput, 'Bahria Town');
    expect(
      screen.getByRole('heading', { name: 'Bilal Khan' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Hira Ahmed' }),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.selectOptions(statusSelect, 'pending');
    expect(screen.getByText('Showing 2 of 3')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Hira Ahmed' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Bilal Khan' }),
    ).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'no matching tenant');
    expect(
      screen.getByRole('heading', { name: 'No matching requests' }),
    ).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(
      screen.getByRole('heading', { name: 'Bilal Khan' }),
    ).toBeInTheDocument();
    expect(getOwnerRentalRequests).toHaveBeenCalledTimes(1);
  });

  it('accepts and rejects pending requests and updates their displayed status', async () => {
    const user = userEvent.setup();
    const acceptedRequest = { ...rentalRequests[0], status: 'approved' };
    const rejectedRequest = { ...rentalRequests[2], status: 'rejected' };
    updateOwnerRentalRequestStatus
      .mockResolvedValueOnce({
        success: true,
        message: 'Rental request accepted successfully.',
        data: { rentalRequest: acceptedRequest },
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'Rental request rejected successfully.',
        data: { rentalRequest: rejectedRequest },
      });

    renderApp();

    const hiraCard = (await screen.findByRole('heading', { name: 'Hira Ahmed' }))
      .closest('article');
    await user.click(within(hiraCard).getByRole('button', { name: 'Accept' }));

    expect(updateOwnerRentalRequestStatus).toHaveBeenNthCalledWith(
      1,
      rentalRequests[0].id,
      'approved',
    );
    expect(
      await screen.findByText('Rental request accepted successfully.'),
    ).toBeInTheDocument();
    expect(within(hiraCard).getByLabelText('Status: Accepted')).toBeInTheDocument();
    expect(within(hiraCard).queryByRole('button', { name: 'Accept' }))
      .not.toBeInTheDocument();

    const daniyalCard = screen
      .getByRole('heading', { name: 'Daniyal Ali' })
      .closest('article');
    await user.click(within(daniyalCard).getByRole('button', { name: 'Reject' }));

    expect(updateOwnerRentalRequestStatus).toHaveBeenNthCalledWith(
      2,
      rentalRequests[2].id,
      'rejected',
    );
    expect(
      await screen.findByText('Rental request rejected successfully.'),
    ).toBeInTheDocument();
    expect(within(daniyalCard).getByLabelText('Status: Rejected'))
      .toBeInTheDocument();
  });

  it('shows an action error and leaves the pending request available to retry', async () => {
    const user = userEvent.setup();
    updateOwnerRentalRequestStatus.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'Rental request decisions are temporarily unavailable.' },
      },
    });

    renderApp();

    const requestCard = (
      await screen.findByRole('heading', { name: 'Hira Ahmed' })
    ).closest('article');
    await user.click(within(requestCard).getByRole('button', { name: 'Reject' }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Rental request decisions are temporarily unavailable.');
    expect(within(requestCard).getByLabelText('Status: Pending')).toBeInTheDocument();
    expect(within(requestCard).getByRole('button', { name: 'Reject' }))
      .toBeEnabled();
  });

  it('shows a load error and retries the owner request query', async () => {
    const user = userEvent.setup();
    getOwnerRentalRequests
      .mockRejectedValueOnce({
        response: {
          data: { message: 'Owner requests are temporarily unavailable.' },
        },
      })
      .mockResolvedValueOnce(ownerRequestsResponse([]));

    renderApp();

    expect(
      await screen.findByText('Owner requests are temporarily unavailable.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(
      await screen.findByRole('heading', { name: 'No rental requests yet' }),
    ).toBeInTheDocument();
    expect(getOwnerRentalRequests).toHaveBeenCalledTimes(2);
  });

  it('redirects tenants before requesting owner rental data', async () => {
    renderApp('/owner/requests', tenantUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(getOwnerRentalRequests).not.toHaveBeenCalled());
  });
});
