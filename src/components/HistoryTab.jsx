import React, { useState, useEffect, useCallback } from 'react';

function shortId(id) {
  if (!id) return '';
  if (id.length <= 18) return id;
  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

function fmtTime(ts) {
  if (!ts) return '';
  const n = Number(ts);
  const ms = n < 1e12 ? n * 1000 : n;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtAmount(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function HistoryTab({ state, getTransactions, explorerUrl, connect }) {
  const connected = state && state.connected;

  const [txs, setTxs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!connected) return;
    setBusy(true);
    setErr('');
    try {
      const list = await getTransactions();
      setTxs(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e && e.message ? e.message : 'Could not load transactions.');
    } finally {
      setBusy(false);
    }
  }, [connected, getTransactions]);

  useEffect(() => { load(); }, [load]);

  if (!connected) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 'var(--sp-4)' }}>
          Connect a wallet to view transaction history.
        </p>
        <button className="btn btn-accent" onClick={connect}>Connect wallet</button>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
        <div className="balance-label">Recent activity</div>
        <button className="pill" onClick={load} disabled={busy}>{busy ? '…' : '↻'}</button>
      </div>

      {busy && txs.length === 0 && (
        <div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 10 }} />
          ))}
        </div>
      )}

      {err && (
        <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', textAlign: 'center', padding: 'var(--sp-4)' }}>
          {err}
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <button className="btn" onClick={load}>Retry</button>
          </div>
        </div>
      )}

      {!busy && !err && txs.length === 0 && (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 'var(--sp-5)' }}>
          No transactions yet.
        </div>
      )}

      {txs.map((tx, i) => {
        const id = tx.txId || tx.txid || tx.id || tx.hash || '';
        const amount = tx.amount != null ? tx.amount : tx.value;
        const dir = tx.direction || tx.type || (Number(amount) < 0 ? 'sent' : 'received');
        const incoming = String(dir).toLowerCase().includes('recei') || String(dir).toLowerCase() === 'in' || (Number(amount) > 0 && !String(dir).toLowerCase().includes('sent'));
        const confs = tx.confirmations != null ? tx.confirmations : (tx.confirmed ? '✓' : null);
        const ts = tx.timestamp || tx.time || tx.blockTime || tx.date;

        return (
          <div key={id || i} className="tx-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <span
                aria-hidden="true"
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 16, flexShrink: 0,
                }}
              >
                {incoming ? '↓' : '↑'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                  {incoming ? 'Received' : 'Sent'}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>
                  {fmtTime(ts)}
                  {confs != null && (
                    <span style={{ marginLeft: 8 }}>
                      · {typeof confs === 'number' ? `${confs} conf${confs === 1 ? '' : 's'}` : confs}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: incoming ? 'var(--accent)' : 'var(--text)' }}>
                {incoming ? '+' : '-'}{fmtAmount(Math.abs(Number(amount) || 0))} KAS
              </div>
              {id && (
                <a
                  href={explorerUrl(id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 'var(--fs-xs)' }}
                >
                  {shortId(id)} ↗
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
