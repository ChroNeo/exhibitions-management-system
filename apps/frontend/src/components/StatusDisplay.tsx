import React from 'react';
import type { LiffState } from '../hook/useLiff';

interface StatusDisplayProps<T> {
  state: LiffState<T>;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
  className?: string;
}

export function StatusDisplay<T>({
  state,
  onRetry,
  children,
  className = ''
}: StatusDisplayProps<T>) {
  if (state.status === 'initializing') {
    return (
      <div className={`status-message ${className}`}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (state.status === 'not_logged_in') {
    return (
      <div className={`status-message ${className}`}>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className={`status-message ${className}`}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className={`status-message ${className}`}>
        <div className="error-icon">🚫</div>
        <h3>Error</h3>
        <p className="error-message">{state.message}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
