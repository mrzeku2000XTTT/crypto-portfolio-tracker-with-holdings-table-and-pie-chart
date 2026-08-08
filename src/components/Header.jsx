import React from 'react';

export default function Header({ lastUpdated, isRefreshing, onRefresh }) {
  const timeStr = lastUpdated ? lastUpdated.toLocaleTimeString() : '—';

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">₿</div>
        <div>
          <h1>CryptoTrack</h1>
          <p className="logo-sub">Portfolio Manager</p>
        </div>
      </div>
      <div className="header-right">
        <span className="live-badge">
          <span className={`live-dot ${isRefreshing ? 'live-dot-busy' : ''}`} />
          LIVE
        </span>
        <span className="last-updated">Updated {timeStr}</span>
        <button className="refresh-btn" onClick={onRefresh} disabled={isRefreshing}>
          <span className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}>↻</span>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
