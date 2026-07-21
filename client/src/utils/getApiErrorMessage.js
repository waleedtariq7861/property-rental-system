export function getApiErrorMessage(error) {
  return (
    error.response?.data?.message ||
    (error.code === 'ECONNABORTED'
      ? 'The API health check timed out.'
      : 'The API is currently unreachable.')
  );
}
