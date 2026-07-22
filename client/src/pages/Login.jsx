import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPage from '../components/AuthPage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { validateEmail, validatePassword } from '../utils/authValidation.js';

const initialValues = {
  email: '',
  password: '',
};

function Login() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const submitTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(submitTimer.current), []);

  function getFieldError(name, value) {
    return name === 'email' ? validateEmail(value) : validatePassword(value);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setSubmitMessage('');

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

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      email: validateEmail(values.email),
      password: validatePassword(values.password),
    };

    setErrors(nextErrors);
    setSubmitMessage('');

    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    submitTimer.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage(
        'Your details passed frontend validation. Secure sign in will be connected in Phase 2.',
      );
    }, 900);
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
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="Enter your password"
            value={values.password}
          />
        </div>

        {submitMessage && (
          <div className="alert alert-success auth-submit-message" role="status">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span>{submitMessage}</span>
          </div>
        )}

        <button className="btn btn-brand btn-lg w-100" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoadingSpinner label="Signing in..." /> : 'Sign in'}
        </button>
      </form>
    </AuthPage>
  );
}

export default Login;
