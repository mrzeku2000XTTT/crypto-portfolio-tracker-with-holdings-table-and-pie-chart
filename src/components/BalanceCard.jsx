import React from 'react';

function fmtKas(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

function fmtUsd(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BalanceCard({ state, price, connect, loading, refresh }) {
  const connected = state && state.connected;

  if (!connected) {
    return (
      <div className="balance-card">
        <div className="balance-label">Your balance</div>
        <div className="balance-kas" style={{ fontSize: '1.35rem', opacity: 0.85 }}>
          No wallet connected
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', margin: '4px 0 16px' }}>
          Create or import a Kaspa wallet to see your live balance.
        </p>
        <button className="btn btn-accent" onClick={connect} disabled={loading}>
          {loading ? 'Connecting…' : 'Connect wallet'}
        </button>
      </div>
    );
  }

  const bal = Number(state.balance) || 0;
  const usd = bal * (Number(price) || 0);

  return (
    <div className="balance-card">
      <div className="balance-label">Total balance</div>
      {loading ? (
        <div className="skeleton" style={{ height: 44, width: '60%', margin: '10px auto', borderRadius: 12 }} />
      ) : (
        <div className="balance-kas">
          {fmtKas(bal)}<span>KAS</span>
        </div>
      )}
      <div className="balance-usd">
        {price ? `≈ ${fmtUsd(usd)}` : 'USD price unavailable'}
      </div>
      {price > 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', marginTop: 6 }}>
          1 KAS = {fmtUsd(price)}
        </div>
      )}
      {refresh && (
        <button
          className="btn"
          onClick={refresh}
          disabled={loading}
          style={{ marginTop: 'var(--sp-4)', minHeight: 38, padding: '8px 16px', fontSize: 'var(--fs-sm)' }}
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      )}
    </div>
  );
}
