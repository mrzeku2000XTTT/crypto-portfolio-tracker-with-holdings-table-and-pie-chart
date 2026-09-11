import React, { useState } from 'react';

function fmtUsd(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function SendTab({ state, price, send, isValidAddress, explorerUrl, connect, loading }) {
  const connected = state && state.connected;
  const watchOnly = state && state.mode === 'watch';

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [txId, setTxId] = useState('');

  if (!connected) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 'var(--sp-4)' }}>
          Connect a wallet to send KAS.
        </p>
        <button className="btn btn-accent" onClick={connect} disabled={loading}>Connect wallet</button>
      </div>
    );
  }

  if (watchOnly) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>
          This is a watch-only wallet. Sending is not available.
        </p>
      </div>
    );
  }

  const amtNum = parseFloat(amount);
  const usdPreview = amtNum > 0 && price ? amtNum * price : 0;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setTxId('');

    const addr = to.trim();
    if (!addr) { setErr('Enter a destination address.'); return; }
    if (!isValidAddress(addr)) { setErr('That is not a valid Kaspa address.'); return; }
    if (!(amtNum > 0)) { setErr('Enter an amount greater than 0.'); return; }
    const bal = Number(state.balance) || 0;
    if (amtNum > bal) { setErr('Amount exceeds your available balance.'); return; }

    setBusy(true);
    try {
      const id = await send(addr, amtNum);
      setTxId(id || '');
      setTo('');
      setAmount('');
    } catch (e2) {
      setErr(e2 && e2.message ? e2.message : 'Send failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const setMax = () => {
    setAmount(String(Number(state.balance) || 0));
  };

  return (
    <form className="card" onSubmit={submit}>
      <label className="field-label" htmlFor="send-to">Send to</label>
      <input
        id="send-to"
        className="input"
        placeholder="kaspa:qz..."
        value={to}
        onChange={(e) => setTo(e.target.value)}
        autoComplete="off"
        spellCheck="false"
      />

      <label className="field-label" htmlFor="send-amount" style={{ marginTop: 'var(--sp-4)' }}>
        Amount (KAS)
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id="send-amount"
          className="input"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          type="button"
          onClick={setMax}
          className="pill"
          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: '4px 12px', minHeight: 0 }}
        >
          Max
        </button>
      </div>

      {usdPreview > 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginTop: 6 }}>
          ≈ {fmtUsd(usdPreview)}
        </div>
      )}

      {err && (
        <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)' }}>
          {err}
        </div>
      )}

      {txId && (
        <div style={{ color: 'var(--accent)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)', wordBreak: 'break-all' }}>
          Sent! <a href={explorerUrl(txId)} target="_blank" rel="noreferrer">View on explorer ↗</a>
        </div>
      )}

      <button className="btn btn-accent" type="submit" disabled={busy} style={{ marginTop: 'var(--sp-4)', width: '100%' }}>
        {busy ? 'Sending…' : 'Send KAS'}
      </button>
    </form>
  );
}
