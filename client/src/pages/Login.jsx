import { useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import AuthPage from '../components/AuthPage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateEmail, validatePassword } from '../utils/authValidation.js';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../utils/getApiErrorMessage.js';

const initialValues = {
  email: '',
  password: '',
};

function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isRestoring, login } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function getFieldError(name, value) {
    return name === 'email' ? validateEmail(value) : validatePassword(value);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setSubmitError('');

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: getFieldError(name, value),
      }));
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target;
    setErrors((current) => ({
      ...current,
      [name]: getFieldError(name, value),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = {
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };

    setErrors(nextErrors);
    setSubmitError('');

    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      });

      const requestedPath =
        typeof location.state?.from === 'string' ? location.state.from : '/profile';
      const destination = requestedPath === '/login' ? '/profile' : requestedPath;

      navigate(destination, {
        replace: true,
        state: { successMessage: 'Login successful. Welcome back to RentEase.' },
      });
    } catch (error) {
      setErrors((current) => ({
        ...current,
        ...getApiValidationErrors(error),
      }));
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isRestoring && isAuthenticated) {
    return <Navigate replace to="/profile" />;
  }

  return (
    <AuthPage
      asideDescription="Find your next home, manage rental activity, and keep every step of the journey organized in one place."
      asideTitle="Welcome to a simpler way to rent."
      description="Enter your account details to continue to RentEase."
      eyebrow="Account access"
      footer={(
        <p className="text-center text-secondary mb-0">
          New to RentEase? <Link to="/register">Create an account</Link>
        </p>
      )}
      highlights={[
        'Browse rental opportunities with confidence',
        'Keep your property journey in one place',
        'Designed for tenants and property owners',
      ]}
      icon="bi-person-lock"
      title="Welcome back"
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="loginEmail">Email address</label>
          <input
            aria-describedby={errors.email ? 'loginEmailError' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={`form-control form-control-lg${errors.email ? ' is-invalid' : ''}`}
            id="loginEmail"
            name="email"
            disabled={isSubmitting}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="name@example.com"
            type="email"
            value={values.email}
          />
          {errors.email && (
            <div className="field-error" id="loginEmailError">{errors.email}</div>
          )}
        </div>

        <div className="mb-4">
          <PasswordField
            autoComplete="current-password"
            error={errors.password}
            id="loginPassword"
            label="Password"
            name="password"
            disabled={isSubmitting}
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="Enter your password"
            value={values.password}
          />
        </div>

        {location.state?.successMessage && !submitError && (
          <div className="alert alert-success auth-submit-message" role="status">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span>{location.state.successMessage}</span>
          </div>
        )}

        {submitError && (
          <div className="alert alert-danger auth-submit-message" role="alert">
            <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <button
          className="btn btn-brand btn-lg w-100"
          disabled={isSubmitting || isRestoring}
          type="submit"
        >
          {isSubmitting ? <LoadingSpinner label="Signing in..." /> : 'Sign in'}
        </button>
      </form>
    </AuthPage>
  );
}

export default Login;
