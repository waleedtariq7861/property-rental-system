import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { saveStoredAuth } from '../utils/authStorage.js';
import {
  getAuthenticatedProfile,
  getRoleTest,
  loginAccount,
  registerAccount,
} from '../services/authService.js';

vi.mock('../services/authService.js', () => ({
  getAuthenticatedProfile: vi.fn(),
  getRoleTest: vi.fn(),
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
}));

const tenantUser = {
  id: 101,
  fullName: 'Phase One Tenant',
  email: 'phase.one.tenant@example.test',
  role: 'tenant',
};

const ownerUser = {
  id: 102,
  fullName: 'Phase One Owner',
  email: 'phase.one.owner@example.test',
  role: 'owner',
};

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Phase 1 frontend authentication flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens the login page with required account controls', async () => {
    renderApp('/login');

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show password' }),
    ).toBeInTheDocument();
  });

  it('shows login validation before submitting', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    const submitButton = await screen.findByRole('button', { name: 'Sign in' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(loginAccount).not.toHaveBeenCalled();
  });

  it('opens registration and validates required fields', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    expect(
      await screen.findByRole('heading', { name: 'Create your account' }),
    ).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: 'Create account' });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.clear(screen.getByLabelText('Email address'));
    await user.clear(screen.getByLabelText('Password'));
    await user.clear(screen.getByLabelText('Confirm password'));
    await user.click(submitButton);

    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it('validates registration name, email, password length, and confirmation', async () => {
    const user = userEvent.setup();
    renderApp('/register');

    await screen.findByRole('heading', { name: 'Create your account' });
    await user.type(screen.getByLabelText('Full name'), 'A');
    await user.type(screen.getByLabelText('Email address'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm password'), 'different');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      screen.getByText('Full name must be at least 2 characters.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(
      screen.getByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(registerAccount).not.toHaveBeenCalled();
  });

  it('registers through the auth service and redirects to login', async () => {
    const user = userEvent.setup();
    registerAccount.mockResolvedValue({
      success: true,
      message: 'Registration successful.',
      data: { user: ownerUser },
    });
    renderApp('/register');

    await screen.findByRole('heading', { name: 'Create your account' });
    await user.type(screen.getByLabelText('Full name'), ownerUser.fullName);
    await user.type(screen.getByLabelText('Email address'), ownerUser.email);
    await user.selectOptions(screen.getByLabelText('Account type'), 'owner');
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!');
    await user.type(screen.getByLabelText('Confirm password'), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Registration successful. Please sign in with your new account.'),
    ).toBeInTheDocument();
    expect(registerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: ownerUser.email,
        role: 'owner',
        confirmPassword: 'SecurePass123!',
      }),
    );
  });

  it('logs in and opens the protected profile', async () => {
    const user = userEvent.setup();
    loginAccount.mockResolvedValue({
      success: true,
      message: 'Login successful.',
      data: {
        token: 'test-jwt-token',
        tokenType: 'Bearer',
        expiresIn: '1h',
        user: tenantUser,
      },
    });
    renderApp('/login');

    await screen.findByRole('heading', { name: 'Welcome back' });
    await user.type(screen.getByLabelText('Email address'), tenantUser.email);
    await user.type(screen.getByLabelText('Password'), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByRole('heading', { name: 'Your RentEase profile' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(tenantUser.fullName)).toHaveLength(2);
    expect(screen.getByText(tenantUser.email)).toBeInTheDocument();
  });

  it('restores a saved session through the protected profile API', async () => {
    saveStoredAuth({
      token: 'restored-test-jwt-token',
      user: tenantUser,
    });
    getAuthenticatedProfile.mockResolvedValue({
      success: true,
      data: { user: tenantUser },
    });

    renderApp('/profile');

    expect(
      await screen.findByRole('heading', { name: 'Your RentEase profile' }),
    ).toBeInTheDocument();
    expect(getAuthenticatedProfile).toHaveBeenCalledOnce();
    expect(screen.getByText(tenantUser.email)).toBeInTheDocument();
  });

  it('fails closed when a saved session cannot be verified', async () => {
    saveStoredAuth({
      token: 'unverified-owner-token',
      user: ownerUser,
    });
    getAuthenticatedProfile.mockRejectedValue(new Error('API unavailable'));

    renderApp('/owner/dashboard');

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('rentease.auth')).toBeNull();
  });

  it('redirects an unauthenticated protected request to login', async () => {
    renderApp('/profile');

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
  });

  it('redirects the wrong role to the unauthorized page', async () => {
    saveStoredAuth({
      token: 'tenant-role-test-token',
      user: tenantUser,
    });
    getAuthenticatedProfile.mockResolvedValue({
      success: true,
      data: { user: tenantUser },
    });

    renderApp('/admin-access');

    expect(
      await screen.findByRole('heading', { name: 'Access is not authorized.' }),
    ).toBeInTheDocument();
    expect(getRoleTest).not.toHaveBeenCalled();
  });

  it('verifies an owner through the owner-only API route', async () => {
    saveStoredAuth({
      token: 'owner-role-test-token',
      user: ownerUser,
    });
    getAuthenticatedProfile.mockResolvedValue({
      success: true,
      data: { user: ownerUser },
    });
    getRoleTest.mockResolvedValue({
      success: true,
      message: 'Property owner access confirmed.',
      data: { user: ownerUser },
    });

    renderApp('/owner-access');

    expect(
      await screen.findByText('Property owner access confirmed.'),
    ).toBeInTheDocument();
    expect(getRoleTest).toHaveBeenCalledWith(
      'owner',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('logs out, clears the UI state, and returns to login', async () => {
    const user = userEvent.setup();
    saveStoredAuth({
      token: 'logout-test-token',
      user: tenantUser,
    });
    getAuthenticatedProfile.mockResolvedValue({
      success: true,
      data: { user: tenantUser },
    });

    renderApp('/profile');

    await screen.findByRole('heading', { name: 'Your RentEase profile' });
    const logoutButtons = screen.getAllByRole('button', { name: 'Log out' });
    await user.click(logoutButtons[0]);

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Login' })).toHaveLength(2);
  });
});
