// src/components/common/Button/Button.jsx

import React from 'react';
import './Button.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, success, danger
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  className = ''
}) => {
  const buttonClass = `
    btn 
    btn-${variant} 
    btn-${size} 
    ${fullWidth ? 'btn-full-width' : ''} 
    ${loading ? 'btn-loading' : ''} 
    ${className}
  `.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClass}
    >
      {loading ? (
        <span className="btn-spinner">Loading...</span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;