import React from 'react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner-icon">⚠</span>
      <span className="error-banner-text">
        Couldn’t load live prices: {message}
      </span>
      <button className="error-banner-retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
