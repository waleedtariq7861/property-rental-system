import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPage from '../components/AuthPage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PasswordField from '../components/PasswordField.jsx';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from '../utils/authValidation.js';
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
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const submitTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(submitTimer.current), []);

  function getFieldError(name, value, currentValues = values) {
    if (name === 'fullName') return validateRequired(value, 'Full name');
    if (name === 'email') return validateEmail(value);
    if (name === 'password') return validatePassword(value);
    if (name === 'confirmPassword') {
      return validatePasswordConfirmation(value, currentValues.password);
    }
    if (name === 'role') return value ? '' : 'Select an account type.';
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
    setSubmitMessage('');

    setErrors((current) => {
      const nextErrors = { ...current };
      if (current[name]) nextErrors[name] = getFieldError(name, value, nextValues);
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

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = Object.keys(values).reduce((result, name) => ({
      ...result,
      [name]: getFieldError(name, values[name]),
    }), {});

    setErrors(nextErrors);
    setSubmitMessage('');

    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    submitTimer.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage(
        'Your details passed frontend validation. Secure registration will be connected in Phase 2.',
      );
    }, 900);
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
              onBlur={handleBlur}
              onChange={handleChange}
              placeholder="Repeat your password"
              value={values.confirmPassword}
            />
          </div>

          {submitMessage && (
            <div className="col-12">
              <div className="alert alert-success auth-submit-message mb-0" role="status">
                <i className="bi bi-check-circle-fill" aria-hidden="true" />
                <span>{submitMessage}</span>
              </div>
            </div>
          )}

          <div className="col-12 mt-4">
            <button className="btn btn-brand btn-lg w-100" disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoadingSpinner label="Creating account..." /> : 'Create account'}
            </button>
          </div>
        </div>
      </form>
    </AuthPage>
  );
}

export default Register;
