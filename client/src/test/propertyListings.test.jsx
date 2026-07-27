import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Properties from '../pages/Properties.jsx';
import { getProperties } from '../services/propertyService.js';

vi.mock('../services/propertyService.js', () => ({
  getProperties: vi.fn(),
}));

const apartment = {
  id: 11,
  ownerId: 4,
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

describe('Property listings page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the property request is pending', () => {
    getProperties.mockReturnValue(new Promise(() => {}));

    render(<Properties />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading properties...');
  });

  it('renders property data and expands the details button', async () => {
    const user = userEvent.setup();
    getProperties.mockResolvedValue({
      success: true,
      data: {
        properties: [apartment],
        count: 1,
      },
    });

    render(<Properties />);

    expect(
      await screen.findByRole('heading', { name: apartment.title }),
    ).toBeInTheDocument();
    expect(screen.getByText('PKR 85,000')).toBeInTheDocument();
    expect(screen.getByText(apartment.address)).toBeInTheDocument();
    expect(screen.getByText('2 Bedrooms')).toBeInTheDocument();
    expect(screen.getByText('2 Bathrooms')).toBeInTheDocument();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByAltText(`${apartment.title} in Islamabad`)).toHaveAttribute(
      'src',
      apartment.imageUrl,
    );

    await user.click(screen.getByRole('button', { name: 'View Details' }));

    expect(screen.getByText(apartment.description)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Hide Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('shows the empty state when there are no available properties', async () => {
    getProperties.mockResolvedValue({
      success: true,
      data: {
        properties: [],
        count: 0,
      },
    });

    render(<Properties />);

    expect(
      await screen.findByRole('heading', {
        name: 'No properties are available right now',
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
      .mockResolvedValueOnce({
        success: true,
        data: {
          properties: [apartment],
          count: 1,
        },
      });

    render(<Properties />);

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
