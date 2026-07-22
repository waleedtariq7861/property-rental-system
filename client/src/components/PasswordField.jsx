import { useState } from 'react';

function PasswordField({ error, id, label, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = `${id}Error`;

  return (
    <div>
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className={`input-group password-input-group${error ? ' has-validation-error' : ''}`}>
        <input
          {...inputProps}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className={`form-control form-control-lg${error ? ' is-invalid' : ''}`}
          id={id}
          type={isVisible ? 'text' : 'password'}
        />
        <button
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="btn password-toggle"
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          <i className={`bi ${isVisible ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
          <span>{isVisible ? 'Hide' : 'Show'}</span>
        </button>
      </div>
      {error && <div className="field-error" id={errorId}>{error}</div>}
    </div>
  );
}

export default PasswordField;
