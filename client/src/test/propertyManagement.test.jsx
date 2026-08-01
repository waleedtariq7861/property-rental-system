import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import AppRoutes from '../routes/AppRoutes.jsx';
import { getAuthenticatedProfile } from '../services/authService.js';
import { getOwnerDashboard } from '../services/ownerDashboardService.js';
import {
  deleteProperty,
  getOwnerProperty,
  updateProperty,
} from '../services/propertyService.js';
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
  PROPERTY_DATA_CHANGED_EVENT: 'rentease:properties-changed',
  createProperty: vi.fn(),
  deleteProperty: vi.fn(),
  getOwnerProperty: vi.fn(),
  getProperties: vi.fn(),
  getPropertyById: vi.fn(),
  updateProperty: vi.fn(),
}));

const ownerUser = {
  id: 520,
  fullName: 'Nadia Property Owner',
  email: 'nadia.owner@example.test',
  phone: '+92 300 4445566',
  role: 'owner',
};

const tenantUser = {
  id: 521,
  fullName: 'Bilal Tenant',
  email: 'bilal.tenant@example.test',
  phone: '+92 300 7778899',
  role: 'tenant',
};

const property = {
  id: 75,
  ownerId: ownerUser.id,
  title: 'Garden Apartment in F-10',
  description: 'An airy apartment with a private garden and secure parking.',
  price: 98000,
  city: 'Islamabad',
  address: 'Street 12, F-10, Islamabad',
  bedrooms: 2,
  bathrooms: 2,
  area: 1250,
  sizeUnit: 'sq_ft',
  propertyType: 'apartment',
  imageUrl: 'https://example.test/garden-apartment.jpg',
  propertyStatus: 'available',
  availabilityStatus: 'available',
  approvalStatus: 'approved',
  currentStatus: 'active',
  contactNumber: ownerUser.phone,
  createdAt: '2026-07-30T09:00:00.000Z',
};

function dashboardResponse(properties = [property]) {
  return {
    success: true,
    data: {
      owner: ownerUser,
      statistics: {
        totalProperties: properties.length,
        activeListings: properties.length,
        recentlyAddedProperties: properties.length,
      },
      properties,
    },
  };
}

function renderApp(path, user = ownerUser) {
  saveStoredAuth({ token: `management-token-${user.id}`, user });
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

describe('Phase 2 Day 5 property management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefills the owner edit form with complete property data', async () => {
    getOwnerProperty.mockResolvedValue({
      success: true,
      data: { property },
    });

    renderApp('/owner/properties/edit/75');

    expect(
      await screen.findByRole('heading', { name: 'Edit Property' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText('Property Title')).toHaveValue(property.title),
    );
    expect(screen.getByLabelText('Property Title')).toHaveValue(property.title);
    expect(screen.getByLabelText('Description')).toHaveValue(property.description);
    expect(screen.getByLabelText('Monthly Price')).toHaveValue(98000);
    expect(screen.getByLabelText('Property Type')).toHaveValue('apartment');
    expect(screen.getByLabelText('City')).toHaveValue(property.city);
    expect(screen.getByLabelText('Full Address')).toHaveValue(property.address);
    expect(screen.getByLabelText('Area (Sq. Ft.)')).toHaveValue(1250);
    expect(screen.getByLabelText('Image URL')).toHaveValue(property.imageUrl);
    expect(screen.getByLabelText('Property Status')).toHaveValue('available');
    expect(screen.getByLabelText('Contact Number')).toHaveValue(
      property.contactNumber,
    );
    expect(getOwnerProperty).toHaveBeenCalledWith(
      '75',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('labels a legacy property area with its stored unit', async () => {
    getOwnerProperty.mockResolvedValue({
      success: true,
      data: {
        property: {
          ...property,
          area: 10,
          sizeUnit: 'marla',
        },
      },
    });

    renderApp('/owner/properties/edit/75');

    expect(
      await screen.findByRole('heading', { name: 'Edit Property' }),
    ).toBeInTheDocument();
    expect(await screen.findByLabelText('Area (Marla)')).toHaveValue(10);
  });

  it('updates the owner property and returns to the refreshed dashboard', async () => {
    const user = userEvent.setup();
    getOwnerProperty.mockResolvedValue({ success: true, data: { property } });
    updateProperty.mockResolvedValue({
      success: true,
      data: { property: { ...property, title: 'Updated Garden Apartment' } },
    });
    getOwnerDashboard.mockResolvedValue(
      dashboardResponse([{ ...property, title: 'Updated Garden Apartment' }]),
    );

    renderApp('/owner/properties/edit/75');
    await screen.findByRole('heading', { name: 'Edit Property' });
    await waitFor(() =>
      expect(screen.getByLabelText('Property Title')).toHaveValue(property.title),
    );
    await user.clear(screen.getByLabelText('Property Title'));
    await user.type(screen.getByLabelText('Property Title'), 'Updated Garden Apartment');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => expect(updateProperty).toHaveBeenCalledTimes(1));
    expect(updateProperty).toHaveBeenCalledWith(
      '75',
      expect.objectContaining({
        title: 'Updated Garden Apartment',
        propertyType: 'apartment',
        price: '98000',
        propertyStatus: 'available',
      }),
    );
    expect(
      await screen.findByText('"Updated Garden Apartment" was updated successfully.'),
    ).toBeInTheDocument();
    expect(getOwnerDashboard).toHaveBeenCalled();
  });

  it('blocks tenants from opening the edit route', async () => {
    renderApp('/owner/properties/edit/75', tenantUser);

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    expect(getOwnerProperty).not.toHaveBeenCalled();
  });

  it('requires confirmation before deleting and refreshes the dashboard afterward', async () => {
    const user = userEvent.setup();
    getOwnerDashboard
      .mockResolvedValueOnce(dashboardResponse())
      .mockResolvedValueOnce(dashboardResponse([]));
    deleteProperty.mockResolvedValue({
      success: true,
      data: { propertyId: property.id },
    });

    renderApp('/owner/dashboard');
    await screen.findByRole('heading', { name: property.title });
    await user.click(screen.getByRole('button', { name: `Delete ${property.title}` }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(deleteProperty).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Keep Property' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Delete ${property.title}` }));
    await user.click(screen.getByRole('button', { name: 'Delete Property' }));

    expect(deleteProperty).toHaveBeenCalledWith(property.id);
    expect(
      await screen.findByText(`"${property.title}" was deleted successfully.`),
    ).toBeInTheDocument();
    await waitFor(() => expect(getOwnerDashboard).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'No properties yet' })).toBeInTheDocument();
  });
});
