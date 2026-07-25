const AUTH_STORAGE_KEY = 'rentease.auth';

export const AUTH_INVALID_EVENT = 'rentease:auth-invalid';

function toSafeUser(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const { id, fullName, email, role } = user;

  if (!id || !fullName || !email || !role) {
    return null;
  }

  return { id, fullName, email, role };
}

export function getStoredAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);
    const user = toSafeUser(parsedValue?.user);

    if (typeof parsedValue?.token !== 'string' || !parsedValue.token || !user) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      token: parsedValue.token,
      user,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveStoredAuth({ token, user }) {
  const safeUser = toSafeUser(user);

  if (typeof window === 'undefined' || typeof token !== 'string' || !safeUser) {
    throw new Error('Valid authentication data is required.');
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      user: safeUser,
    }),
  );
}

export function clearStoredAuth() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getStoredToken() {
  return getStoredAuth()?.token || null;
}
