import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from '../components/AuthPage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PasswordField from '../components/PasswordField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordConfirmation,
  validateRegistrationRole,
} from '../utils/authValidation.js';
import {
  getApiErrorMessage,
  getApiValidationErrors,
} from '../utils/getApiErrorMessage.js';
import {
  sanitizeDigits,
  sanitizeFullName,
} from '../utils/inputSanitizers.js';

const initialValues = {
  fullName: '',
  email: '',
  phone: '',
  role: 'tenant',
  password: '',
  confirmPassword: '',
};

function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, isRestoring, register } = useAuth();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function getFieldError(name, value, currentValues = values) {
    if (name === 'fullName') return validateFullName(value);
    if (name === 'email') return validateEmail(value);
    if (name === 'password') return validatePassword(value);
    if (name === 'confirmPassword') {
      return validatePasswordConfirmation(value, currentValues.password);
    }
    if (name === 'role') return validateRegistrationRole(value);
    return '';
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const nextValue = name === 'phone'
      ? sanitizeDigits(value)
      : name === 'fullName'
        ? sanitizeFullName(value)
        : value;
    const nextValues = { ...values, [name]: nextValue };
    setValues(nextValues);
    setSubmitError('');

    setErrors((current) => {
      const nextErrors = { ...current };
      if (current[name]) {
        nextErrors[name] = getFieldError(name, nextValue, nextValues);
      }
      if (name === 'password' && current.confirmPassword) {
        nextErrors.confirmPassword = getFieldError(
          'confirmPassword',
          nextValues.confirmPassword,
          nextValues,
        );
      }
      return nextErrors;
    });
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

    const nextErrors = Object.keys(values).reduce((result, name) => ({
      ...result,
      [name]: getFieldError(name, values[name]),
    }), {});

    setErrors(nextErrors);
    setSubmitError('');

    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);

    try {
      const result = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone || undefined,
        role: values.role,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      navigate('/login', {
        replace: true,
        state: {
          successMessage: `${result.message} Please sign in with your new account.`,
        },
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
      asideDescription="Create a RentEase profile that fits how you use the platform, whether you are finding a home or listing one."
      asideTitle="Your rental journey starts here."
      description="Tell us a little about yourself to create your account."
      eyebrow="Join RentEase"
      footer={(
        <p className="text-center text-secondary mb-0">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      )}
      highlights={[
        'Choose a tenant or property owner account',
        'Clear, guided account setup',
        'Built to grow with your rental needs',
      ]}
      icon="bi-person-plus"
      title="Create your account"
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label" htmlFor="registerName">Full name</label>
            <input
              aria-describedby={errors.fullName ? 'registerNameError' : undefined}
              aria-invalid={Boolean(errors.fullName)}
              autoComplete="name"
              className={`form-control form-control-lg${errors.fullName ? ' is-invalid' : ''}`}
              id="registerName"
              disabled={isSubmitting}
              maxLength={120}
              name="fullName"
              onBlur={handleBlur}
              onChange={handleChange}
              autoCapitalize="words"
              placeholder="Your full name"
              type="text"
              value={values.fullName}
            />
            {errors.fullName && (
              <div className="field-error" id="registerNameError">{errors.fullName}</div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="registerEmail">Email address</label>
            <input
              aria-describedby={errors.email ? 'registerEmailError' : undefined}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className={`form-control form-control-lg${errors.email ? ' is-invalid' : ''}`}
              id="registerEmail"
              disabled={isSubmitting}
              maxLength={190}
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="name@example.com"
              type="email"
              value={values.email}
            />
            {errors.email && (
              <div className="field-error" id="registerEmailError">{errors.email}</div>
            )}
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="registerPhone">
              Phone number <span className="form-label-optional">(optional)</span>
            </label>
            <input
              autoComplete="tel"
              className="form-control form-control-lg"
              id="registerPhone"
              name="phone"
              disabled={isSubmitting}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={15}
              pattern="[0-9]*"
              placeholder="e.g. 03001234567"
              type="text"
              value={values.phone}
            />
          </div>

          <div className="col-12">
            <label className="form-label" htmlFor="registerRole">Account type</label>
            <select
              aria-describedby={errors.role ? 'registerRoleError' : 'registerRoleHelp'}
              aria-invalid={Boolean(errors.role)}
              className={`form-select form-select-lg${errors.role ? ' is-invalid' : ''}`}
              id="registerRole"
              name="role"
              disabled={isSubmitting}
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.role}
            >
              <option value="tenant">Tenant — I want to rent a property</option>
              <option value="owner">Property Owner — I want to list properties</option>
            </select>
            {errors.role ? (
              <div className="field-error" id="registerRoleError">{errors.role}</div>
            ) : (
              <div className="form-text" id="registerRoleHelp">
                Select the option that best describes how you will use RentEase.
              </div>
            )}
          </div>

          <div className="col-12 col-md-6">
            <PasswordField
              autoComplete="new-password"
              error={errors.password}
              id="registerPassword"
              label="Password"
              name="password"
              disabled={isSubmitting}
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="At least 8 characters"
              value={values.password}
            />
          </div>

          <div className="col-12 col-md-6">
            <PasswordField
              autoComplete="new-password"
              error={errors.confirmPassword}
              id="registerPasswordConfirm"
              label="Confirm password"
              name="confirmPassword"
              disabled={isSubmitting}
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Repeat your password"
              value={values.confirmPassword}
            />
          </div>

          {submitError && (
            <div className="col-12">
              <div className="alert alert-danger auth-submit-message mb-0" role="alert">
                <i className="bi bi-exclamation-circle-fill" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            </div>
          )}

          <div className="col-12 mt-4">
            <button
              className="btn btn-brand btn-lg w-100"
              disabled={isSubmitting || isRestoring}
              type="submit"
            >
              {isSubmitting ? <LoadingSpinner label="Creating account..." /> : 'Create account'}
            </button>
          </div>
        </div>
      </form>
    </AuthPage>
  );
}

export default Register;
