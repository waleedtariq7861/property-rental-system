export function getApiErrorMessage(error) {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (!error.response) {
    return 'The RentEase API is currently unreachable. Please try again shortly.';
  }

  return (
    error.response.status === 403
      ? 'You do not have permission to perform this action.'
      : 'The request could not be completed safely.'
  );
}

export function getApiValidationErrors(error) {
  const details = error.response?.data?.details;

  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(details).filter(([, message]) => typeof message === 'string'),
  );
}
