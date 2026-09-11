import React, { useState, useEffect, useCallback } from 'react';

function shortAddr(a) {
  if (!a) return '';
  if (a.length <= 24) return a;
  return `${a.slice(0, 14)}…${a.slice(-8)}`;
}

export default function ReceiveTab({ state, receiveQR, receiveURI, connect }) {
  const connected = state && state.connected;
  const address = state && state.address;

  const [qr, setQr] = useState('');
  const [uri, setUri] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!connected) return;
    setBusy(true);
    setErr('');
    try {
      const [q, u] = await Promise.all([
        receiveQR().catch(() => ''),
        receiveURI().catch(() => ''),
      ]);
      setQr(q || '');
      setUri(u || '');
    } catch (e) {
      setErr(e && e.message ? e.message : 'Could not generate QR code.');
    } finally {
      setBusy(false);
    }
  }, [connected, receiveQR, receiveURI]);

  useEffect(() => { load(); }, [load]);

  const copy = (text, label) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setMsg(`${label} copied.`);
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg('Copy failed — select manually.');
    }
  };

  if (!connected) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 'var(--sp-4)' }}>
          Connect a wallet to receive KAS.
        </p>
        <button className="btn btn-accent" onClick={connect}>Connect wallet</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="balance-label" style={{ marginBottom: 'var(--sp-4)' }}>Your Kaspa address</div>

      {busy ? (
        <div className="skeleton" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 16 }} />
      ) : qr ? (
        <img
          src={qr}
          alt="Address QR code"
          width={200}
          height={200}
          style={{ borderRadius: 16, background: '#fff', padding: 8, display: 'block', margin: '0 auto' }}
        />
      ) : (
        <div style={{ color: 'var(--muted)', padding: 'var(--sp-5)' }}>QR unavailable</div>
      )}

      {err && (
        <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)' }}>
          {err} <button className="pill" onClick={load} style={{ marginLeft: 8 }}>Retry</button>
        </div>
      )}

      <div
        style={{ marginTop: 'var(--sp-4)', wordBreak: 'break-all', fontSize: 'var(--fs-sm)', color: 'var(--text)', fontFamily: 'ui-monospace, monospace' }}
        title={address}
      >
        {shortAddr(address)}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn" onClick={() => copy(address, 'Address')}>Copy address</button>
        {uri && <button className="btn" onClick={() => copy(uri, 'Payment URI')}>Copy URI</button>}
      </div>

      {msg && (
        <div style={{ color: 'var(--accent)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)' }}>{msg}</div>
      )}
    </div>
  );
}
