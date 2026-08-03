import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import Properties from '../pages/Properties.jsx';
import PropertyDetails from '../pages/PropertyDetails.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import {
  getProperties,
  getPropertyById,
} from '../services/propertyService.js';
import { createRentalRequest } from '../services/rentalRequestService.js';
import { saveStoredAuth } from '../utils/authStorage.js';

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

vi.mock('../services/propertyService.js', () => ({
  PROPERTY_DATA_CHANGED_EVENT: 'rentease:properties-changed',
  getProperties: vi.fn(),
  getPropertyById: vi.fn(),
}));

vi.mock('../services/rentalRequestService.js', () => ({
  createRentalRequest: vi.fn(),
  getMyRentalRequests: vi.fn(),
}));

const apartment = {
  id: 11,
  ownerId: 4,
  ownerName: 'Ali Raza',
  title: 'Contemporary Apartment in F-11',
  description: 'A bright apartment with secure access and reserved parking.',
  price: 85000,
  city: 'Islamabad',
  address: 'Street 14, F-11, Islamabad',
  bedrooms: 2,
  bathrooms: 2,
  propertyType: 'apartment',
  imageUrl: 'https://example.test/apartment.jpg',
  createdAt: '2026-07-25T08:00:00.000Z',
  updatedAt: '2026-07-25T08:00:00.000Z',
};

const tenantUser = {
  id: 21,
  fullName: 'Hira Tenant',
  email: 'hira.tenant@example.test',
  role: 'tenant',
};

const ownerUser = {
  id: 22,
  fullName: 'Omar Owner',
  email: 'omar.owner@example.test',
  role: 'owner',
};

function propertyListResponse(overrides = {}) {
  return {
    success: true,
    data: {
      properties: [apartment],
      count: 1,
      totalCount: 1,
      currentPage: 1,
      totalPages: 1,
      ...overrides,
    },
  };
}

function renderProperties() {
  return render(
    <MemoryRouter>
      <Properties />
    </MemoryRouter>,
  );
}

function renderPropertyDetails(user = null) {
  if (user) {
    saveStoredAuth({ token: `property-details-token-${user.id}`, user });
    getAuthenticatedProfile.mockResolvedValue({
      success: true,
      data: { user },
    });
  }

  return render(
    <MemoryRouter initialEntries={['/properties/11']}>
      <AuthProvider>
        <Routes>
          <Route path="/properties/:id" element={<PropertyDetails />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Property listings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the property request is pending', () => {
    getProperties.mockReturnValue(new Promise(() => {}));

    renderProperties();

    expect(screen.getByRole('status')).toHaveTextContent('Loading properties...');
  });

  it('renders property data, preserves quick details, and links to the full page', async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue(propertyListResponse());

    renderProperties();

    expect(
      await screen.findByRole('heading', { name: apartment.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 85,000')).toBeInTheDocument();
    expect(screen.getByText(apartment.address)).toBeInTheDocument();
    expect(screen.getByText('2 Bedrooms')).toBeInTheDocument();
    expect(screen.getByText('2 Bathrooms')).toBeInTheDocument();
    expect(screen.getAllByText('Apartment')).toHaveLength(2);
    expect(screen.getByAltText(`${apartment.title} in Islamabad`)).toHaveAttribute(
      'src',
      apartment.imageUrl,
    );
    expect(screen.getByRole('link', { name: 'Full details' })).toHaveAttribute(
      'href',
      '/properties/11',
    );

    await user.click(screen.getByRole('button', { name: 'View Details' }));

    expect(screen.getByText(apartment.description)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Hide Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('updates search, filters, and sorting without a page refresh', async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue(propertyListResponse());

    renderProperties();

    await screen.findByRole('heading', { name: apartment.title });
    await user.type(screen.getByLabelText('Search properties'), 'F-11');
    await user.type(screen.getByLabelText('City'), 'Islamabad');
    await user.selectOptions(screen.getByLabelText('Property type'), 'apartment');
    await user.type(screen.getByLabelText('Minimum price'), '50000');
    await user.type(screen.getByLabelText('Maximum price'), '100000');
    await user.type(screen.getByLabelText('Bedrooms'), '2');
    await user.selectOptions(screen.getByLabelText('Sort by'), 'price_desc');

    await waitFor(() => {
      expect(getProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'F-11',
            city: 'Islamabad',
            propertyType: 'apartment',
            minPrice: '50000',
            maxPrice: '100000',
            bedrooms: '2',
            sort: 'price_desc',
            page: 1,
            limit: 9,
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  it('preserves active criteria while changing pages', async () => {
    const user = userEvent.setup();
    getProperties.mockImplementation(({ params }) =>
      Promise.resolve(
        propertyListResponse({
          totalCount: 10,
          currentPage: params.page,
          totalPages: 2,
        }),
      ),
    );

    renderProperties();

    await screen.findByRole('heading', { name: apartment.title });
    await user.type(screen.getByLabelText('Search properties'), 'Islamabad');
    await user.selectOptions(screen.getByLabelText('Property type'), 'apartment');
    await waitFor(() =>
      expect(getProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'Islamabad',
            propertyType: 'apartment',
          }),
        }),
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));

    await waitFor(() =>
      expect(getProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            search: 'Islamabad',
            propertyType: 'apartment',
            page: 2,
          }),
        }),
      ),
    );
  });

  it('returns to the last valid page when refreshed results shrink', async () => {
    const user = userEvent.setup();
    let resultsShrank = false;

    getProperties.mockImplementation(({ params }) => {
      if (resultsShrank && params.page === 2) {
        return Promise.resolve(
          propertyListResponse({
            properties: [],
            count: 0,
            totalCount: 9,
            currentPage: 2,
            totalPages: 1,
          }),
        );
      }

      return Promise.resolve(
        propertyListResponse({
          totalCount: resultsShrank ? 9 : 10,
          currentPage: params.page,
          totalPages: resultsShrank ? 1 : 2,
        }),
      );
    });

    renderProperties();
    await screen.findByRole('heading', { name: apartment.title });
    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
    await waitFor(() =>
      expect(getProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ page: 2 }),
        }),
      ),
    );

    resultsShrank = true;
    window.dispatchEvent(new Event('rentease:properties-changed'));

    await waitFor(() =>
      expect(getProperties).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({ page: 1 }),
        }),
      ),
    );
    expect(
      screen.getByText(
        (_content, element) =>
          element.tagName === 'P' &&
          element.textContent === 'Showing 1–9 of 9 properties',
      ),
    ).toBeInTheDocument();
  });

  it('shows the filtered and unfiltered empty states', async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue(
      propertyListResponse({
        properties: [],
        count: 0,
        totalCount: 0,
        totalPages: 0,
      }),
    );

    renderProperties();

    expect(
      await screen.findByRole('heading', {
        name: 'No properties are available right now',
      }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search properties'), 'missing home');

    expect(
      await screen.findByRole('heading', {
        name: 'No properties match your search',
      }),
    ).toBeInTheDocument();
  });

  it('shows an API error and retries the request', async () => {
    const user = userEvent.setup();
    getProperties
      .mockRejectedValueOnce({
        response: {
          data: {
            message: 'Properties are temporarily unavailable.',
          },
        },
      })
      .mockResolvedValueOnce(propertyListResponse());

    renderProperties();

    expect(
      await screen.findByText('Properties are temporarily unavailable.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    expect(
      await screen.findByRole('heading', { name: apartment.title }),
    ).toBeInTheDocument();
    expect(getProperties).toHaveBeenCalledTimes(2);
  });

  it('refreshes when an owner updates or deletes a property elsewhere', async () => {
    getProperties.mockResolvedValue(propertyListResponse());

    renderProperties();
    await screen.findByRole('heading', { name: apartment.title });
    window.dispatchEvent(new Event('rentease:properties-changed'));

    await waitFor(() => expect(getProperties).toHaveBeenCalledTimes(2));
  });
});

describe('Property details page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the detail request is pending', () => {
    getPropertyById.mockReturnValue(new Promise(() => {}));

    renderPropertyDetails();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Loading property details...',
    );
  });

  it('renders the complete property and owner information', async () => {
    getPropertyById.mockResolvedValue({
      success: true,
      data: {
        property: {
          ...apartment,
          area: 10,
          sizeUnit: 'marla',
        },
      },
    });

    renderPropertyDetails();

    expect(
      await screen.findByRole('heading', { name: apartment.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 85,000')).toBeInTheDocument();
    expect(screen.getAllByText(apartment.address)).toHaveLength(2);
    expect(screen.getByText(apartment.description)).toBeInTheDocument();
    expect(screen.getByText('10 Marla')).toBeInTheDocument();
    expect(screen.getByText(apartment.ownerName)).toBeInTheDocument();
    expect(screen.getByText('25 July 2026')).toBeInTheDocument();
    expect(getPropertyById).toHaveBeenCalledWith(
      '11',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(
      screen.getByRole('link', { name: 'Log in to Send Request' }),
    ).toHaveAttribute('href', '/login');
  });

  it('lets an authenticated tenant send a rental request', async () => {
    const user = userEvent.setup();
    getPropertyById.mockResolvedValue({
      success: true,
      data: { property: apartment },
    });
    createRentalRequest.mockResolvedValue({
      success: true,
      message: 'Rental request sent successfully.',
      data: {
        rentalRequest: {
          id: 91,
          propertyId: apartment.id,
          tenantId: tenantUser.id,
          ownerId: apartment.ownerId,
          status: 'pending',
        },
      },
    });

    renderPropertyDetails(tenantUser);

    await screen.findByRole('heading', { name: apartment.title });
    await user.type(
      await screen.findByLabelText('Message to property owner (optional)'),
      'I would like to arrange a viewing.',
    );
    await user.click(screen.getByRole('button', { name: 'Send Rental Request' }));

    expect(createRentalRequest).toHaveBeenCalledWith({
      propertyId: apartment.id,
      message: 'I would like to arrange a viewing.',
    });
    expect(
      await screen.findByText('Rental request sent successfully.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Sent' })).toBeDisabled();
  });

  it('shows a loading state while the rental request is being sent', async () => {
    const user = userEvent.setup();
    getPropertyById.mockResolvedValue({
      success: true,
      data: { property: apartment },
    });
    createRentalRequest.mockReturnValue(new Promise(() => {}));

    renderPropertyDetails(tenantUser);
    await screen.findByRole('heading', { name: apartment.title });
    await user.click(
      await screen.findByRole('button', { name: 'Send Rental Request' }),
    );

    expect(
      screen.getByRole('button', { name: 'Sending Request...' }),
    ).toBeDisabled();
  });

  it('shows the duplicate-pending-request response distinctly', async () => {
    const user = userEvent.setup();
    getPropertyById.mockResolvedValue({
      success: true,
      data: { property: apartment },
    });
    createRentalRequest.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: 'You already have a pending rental request for this property.',
        },
      },
    });

    renderPropertyDetails(tenantUser);
    await user.click(
      await screen.findByRole('button', { name: 'Send Rental Request' }),
    );

    const duplicateMessage = await screen.findByRole('alert');
    expect(duplicateMessage).toHaveTextContent(
      'You already have a pending rental request for this property.',
    );
    expect(duplicateMessage).toHaveClass('is-duplicate');
  });

  it('shows rental-request errors and keeps the tenant able to retry', async () => {
    const user = userEvent.setup();
    getPropertyById.mockResolvedValue({
      success: true,
      data: { property: apartment },
    });
    createRentalRequest.mockRejectedValue({
      response: {
        status: 503,
        data: { message: 'Rental requests are temporarily unavailable.' },
      },
    });

    renderPropertyDetails(tenantUser);
    await user.click(
      await screen.findByRole('button', { name: 'Send Rental Request' }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Rental requests are temporarily unavailable.',
    );
    expect(
      screen.getByRole('button', { name: 'Send Rental Request' }),
    ).toBeEnabled();
  });

  it('does not offer rental-request submission to property owners', async () => {
    getPropertyById.mockResolvedValue({
      success: true,
      data: { property: apartment },
    });

    renderPropertyDetails(ownerUser);

    expect(
      await screen.findByRole('heading', { name: 'Tenant access only' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send Rental Request' }),
    ).not.toBeInTheDocument();
    expect(createRentalRequest).not.toHaveBeenCalled();
  });

  it('renders a property-specific 404 state', async () => {
    getPropertyById.mockRejectedValue({
      response: {
        status: 404,
        data: { message: 'Property not found.' },
      },
    });

    renderPropertyDetails();

    expect(
      await screen.findByRole('heading', { name: 'Property not found.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Browse properties' }),
    ).toHaveAttribute('href', '/properties');
  });
});
