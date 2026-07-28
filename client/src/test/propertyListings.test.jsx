import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Properties from '../pages/Properties.jsx';
import PropertyDetails from '../pages/PropertyDetails.jsx';
import {
  getProperties,
  getPropertyById,
} from '../services/propertyService.js';

vi.mock('../services/propertyService.js', () => ({
  getProperties: vi.fn(),
  getPropertyById: vi.fn(),
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

function renderPropertyDetails() {
  return render(
    <MemoryRouter initialEntries={['/properties/11']}>
      <Routes>
        <Route path="/properties/:id" element={<PropertyDetails />} />
      </Routes>
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
      data: { property: apartment },
    });

    renderPropertyDetails();

    expect(
      await screen.findByRole('heading', { name: apartment.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 85,000')).toBeInTheDocument();
    expect(screen.getAllByText(apartment.address)).toHaveLength(2);
    expect(screen.getByText(apartment.description)).toBeInTheDocument();
    expect(screen.getByText(apartment.ownerName)).toBeInTheDocument();
    expect(screen.getByText('25 July 2026')).toBeInTheDocument();
    expect(getPropertyById).toHaveBeenCalledWith(
      '11',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
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
