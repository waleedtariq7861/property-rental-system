import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import { getOwnerDashboard } from '../services/ownerDashboardService.js';
import { createProperty } from '../services/propertyService.js';
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

vi.mock('../services/propertyService.js', () => ({
  createProperty: vi.fn(),
  getProperties: vi.fn(),
  getPropertyById: vi.fn(),
}));

const ownerUser = {
  id: 410,
  fullName: 'Mariam Property Owner',
  email: 'mariam.owner@example.test',
  phone: '+92 300 1234567',
  role: 'owner',
};

const tenantUser = {
  id: 411,
  fullName: 'Saad Tenant',
  email: 'saad.tenant@example.test',
  phone: '+92 300 9876543',
  role: 'tenant',
};

const createdProperty = {
  id: 901,
  ownerId: ownerUser.id,
  title: 'Sunny Apartment in F-10',
  description: 'A bright, well located apartment with a private balcony.',
  price: 110000,
  city: 'Islamabad',
  address: 'Street 8, F-10/2, Islamabad',
  bedrooms: 3,
  bathrooms: 2.5,
  area: 1550,
  propertyType: 'apartment',
  imageUrl: 'https://example.test/sunny-apartment.jpg',
  propertyStatus: 'available',
  contactNumber: ownerUser.phone,
  createdAt: '2026-07-30T09:00:00.000Z',
};

function renderApp(path = '/owner/properties/add', user = ownerUser) {
  saveStoredAuth({
    token: `property-creation-token-${user.id}`,
    user,
  });
  getAuthenticatedProfile.mockResolvedValue({
    success: true,
    data: { user },
  });
  getOwnerDashboard.mockResolvedValue({
    success: true,
    data: {
      owner: ownerUser,
      statistics: {
        totalProperties: 1,
        activeListings: 1,
        recentlyAddedProperties: 1,
      },
      properties: [
        {
          ...createdProperty,
          approvalStatus: 'approved',
          availabilityStatus: 'available',
          currentStatus: 'active',
        },
      ],
    },
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function completePropertyForm(user) {
  await user.type(
    screen.getByLabelText('Property Title'),
    '  Sunny Apartment in F-10  ',
  );
  await user.selectOptions(
    screen.getByLabelText('Property Type'),
    'apartment',
  );
  await user.type(
    screen.getByLabelText('Description'),
    '  A bright, well located apartment with a private balcony.  ',
  );
  await user.type(screen.getByLabelText('Monthly Price'), '110000');
  await user.type(screen.getByLabelText('City'), '  Islamabad  ');
  await user.type(
    screen.getByLabelText('Full Address'),
    '  Street 8, F-10/2, Islamabad  ',
  );
  await user.type(screen.getByLabelText('Bedrooms'), '3');
  await user.type(screen.getByLabelText('Bathrooms'), '2.5');
  await user.type(screen.getByLabelText('Area (Sq. Ft.)'), '1550');
  await user.type(
    screen.getByLabelText('Image URL'),
    'https://example.test/sunny-apartment.jpg',
  );
}

describe('Add property page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the complete owner property form with a prefilled contact number', async () => {
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'Add a Property' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Property Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Property Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Monthly Price')).toHaveAttribute(
      'type',
      'number',
    );
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Bedrooms')).toHaveAttribute('min', '1');
    expect(screen.getByLabelText('Bathrooms')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Area (Sq. Ft.)')).toBeInTheDocument();
    expect(screen.getByLabelText('Image URL')).toHaveAttribute('type', 'url');
    expect(screen.getByLabelText('Property Status')).toHaveValue('available');
    expect(screen.getByLabelText('Contact Number')).toHaveValue(ownerUser.phone);
  });

  it('shows clear validation errors and does not submit invalid values', async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByRole('heading', { name: 'Add a Property' });
    await user.clear(screen.getByLabelText('Contact Number'));
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(
      await screen.findByText('Property title is required.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Property type is required.')).toBeInTheDocument();
    expect(screen.getByText('Price is required.')).toBeInTheDocument();
    expect(screen.getByText('Bedrooms is required.')).toBeInTheDocument();
    expect(screen.getByText('Contact number is required.')).toBeInTheDocument();
    expect(createProperty).not.toHaveBeenCalled();
  });

  it('submits trimmed values and redirects to the refreshed owner dashboard', async () => {
    const user = userEvent.setup();
    createProperty.mockResolvedValue({
      success: true,
      data: { property: createdProperty },
    });

    renderApp();
    await screen.findByRole('heading', { name: 'Add a Property' });
    await completePropertyForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    await waitFor(() => expect(createProperty).toHaveBeenCalledTimes(1));
    expect(createProperty).toHaveBeenCalledWith({
      title: createdProperty.title,
      propertyType: createdProperty.propertyType,
      description: createdProperty.description,
      price: '110000',
      city: createdProperty.city,
      address: createdProperty.address,
      bedrooms: '3',
      bathrooms: '2.5',
      area: '1550',
      imageUrl: createdProperty.imageUrl,
      propertyStatus: 'available',
      contactNumber: ownerUser.phone,
    });
    expect(
      await screen.findByText(
        `"${createdProperty.title}" was added successfully and is now in your portfolio.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: createdProperty.title }),
    ).toBeInTheDocument();
    expect(getOwnerDashboard).toHaveBeenCalled();
  });

  it('disables the form and shows a spinner while saving', async () => {
    const user = userEvent.setup();
    createProperty.mockReturnValue(new Promise(() => {}));

    renderApp();
    await screen.findByRole('heading', { name: 'Add a Property' });
    await completePropertyForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    const savingButton = await screen.findByRole('button', {
      name: 'Saving property...',
    });
    expect(savingButton).toBeDisabled();
    expect(screen.getByLabelText('Property Title')).toBeDisabled();
  });

  it('renders API validation and request errors without leaving the form', async () => {
    const user = userEvent.setup();
    createProperty.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          details: {
            imageUrl: 'Enter a valid HTTP or HTTPS image URL.',
          },
        },
      },
    });

    renderApp();
    await screen.findByRole('heading', { name: 'Add a Property' });
    await completePropertyForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Property' }));

    expect(await screen.findByText('Validation failed')).toBeInTheDocument();
    expect(
      screen.getByText('Enter a valid HTTP or HTTPS image URL.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Add a Property' }),
    ).toBeInTheDocument();
  });

  it('redirects a tenant to Access Denied before rendering the form', async () => {
    renderApp('/owner/properties/add', tenantUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Add a Property' }),
    ).not.toBeInTheDocument();
    expect(createProperty).not.toHaveBeenCalled();
  });
});
