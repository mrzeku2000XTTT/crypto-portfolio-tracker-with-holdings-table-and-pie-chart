import React, { useEffect, useMemo, useState } from 'react';
import { loadSubs, saveSubs, uid } from '../lib/store.js';

const CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const COLORS = ['#70C7BA', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function monthlyFactor(cycle) {
  if (cycle === 'weekly') return 4.33;
  if (cycle === 'yearly') return 1 / 12;
  return 1;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.round((due - now) / 86400000);
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SubscriptionTracker({ price }) {
  const [subs, setSubs] = useState(() => loadSubs());
  const [service, setService] = useState('');
  const [amountKas, setAmountKas] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [nextDue, setNextDue] = useState(todayStr());
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    saveSubs(subs);
  }, [subs]);

  const usdOf = (kas) => {
    if (!price || typeof price.usd !== 'number') return null;
    return kas * price.usd;
  };

  const totals = useMemo(() => {
    let mKas = 0;
    subs.forEach((s) => {
      if (!s.active) return;
      mKas += (Number(s.amountKas) || 0) * monthlyFactor(s.cycle);
    });
    const mUsd = price && typeof price.usd === 'number' ? mKas * price.usd : null;
    return { mKas, mUsd };
  }, [subs, price]);

  const addSub = (e) => {
    e.preventDefault();
    setError('');
    const name = service.trim();
    const amt = parseFloat(amountKas);
    if (!name) {
      setError('Enter a service name.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Enter a valid KAS amount greater than 0.');
      return;
    }
    if (!nextDue) {
      setError('Pick a next due date.');
      return;
    }
    const sub = {
      id: uid(),
      service: name,
      amountKas: amt,
      cycle,
      nextDue,
      active: true,
      color,
    };
    setSubs((prev) => [sub, ...prev]);
    setService('');
    setAmountKas('');
    setCycle('monthly');
    setNextDue(todayStr());
    setColor(COLORS[(COLORS.indexOf(color) + 1) % COLORS.length]);
  };

  const toggle = (id) => {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
  };

  const remove = (id) => {
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="kb-panel">
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" aria-hidden="true" />
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>KAS Price</div>
              {price && typeof price.usd === 'number' ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ fontSize: 20 }}>${price.usd.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong>
                  {typeof price.change24h === 'number' && (
                    <span style={{ fontSize: 13, color: price.change24h >= 0 ? 'var(--accent)' : '#ef4444' }}>
                      {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="kb-progress" style={{ width: 120, height: 20, borderRadius: 8 }} />
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
            {price ? `Updated ${fmtTime(price.updatedAt)}` : 'Loading price...'}
            {price && price.source ? <div style={{ opacity: 0.7 }}>via {price.source}</div> : null}
          </div>
        </div>
      </div>

      <form className="card" onSubmit={addSub} style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <input
            className="input"
            placeholder="Service name"
            value={service}
            onChange={(e) => setService(e.target.value)}
            aria-label="Service name"
          />
          <input
            className="input"
            type="number"
            step="any"
            min="0"
            placeholder="Amount (KAS)"
            value={amountKas}
            onChange={(e) => setAmountKas(e.target.value)}
            aria-label="Amount in KAS"
          />
          <select className="input" value={cycle} onChange={(e) => setCycle(e.target.value)} aria-label="Billing cycle">
            {CYCLES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
            aria-label="Next due date"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Color</span>
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid var(--text)' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button className="btn btn-accent" type="submit">Add subscription</button>
        </div>
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{error}</div>}
      </form>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly (KAS)</div>
            <strong style={{ fontSize: 22 }}>{totals.mKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly (USD)</div>
            <strong style={{ fontSize: 22 }}>
              {totals.mUsd === null ? '-' : `$${totals.mUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
            </strong>
          </div>
        </div>
      </div>

      {subs.length === 0 ? (
        <div className="kb-empty">
          <div style={{ fontSize: 32, marginBottom: 8 }}>-</div>
          <p style={{ margin: 0 }}>No subscriptions yet.</p>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Add your first Kaspa subscription above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {subs.map((s) => {
            const usd = usdOf(Number(s.amountKas) || 0);
            const d = daysUntil(s.nextDue);
            const dueSoon = d !== null && d >= 0 && d <= 7;
            const overdue = d !== null && d < 0;
            return (
              <div key={s.id} className="kb-sub-card" style={{ opacity: s.active ? 1 : 0.55, borderLeft: `4px solid ${s.color || 'var(--accent)'}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 16 }}>{s.service}</strong>
                    <span className="pill">{s.cycle}</span>
                    {!s.active && <span className="pill" style={{ opacity: 0.7 }}>paused</span>}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 14 }}>
                    <span><strong>{(Number(s.amountKas) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</strong></span>
                    <span style={{ color: 'var(--muted)' }}>{usd === null ? '-' : `$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    <span style={{ color: overdue ? '#ef4444' : dueSoon ? 'var(--accent)' : 'var(--muted)' }}>
                      Next due {s.nextDue}
                      {d !== null && (
                        <> - {overdue ? `${Math.abs(d)}d overdue` : d === 0 ? 'today' : `in ${d}d`}</>
                      )}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button className="btn" type="button" onClick={() => toggle(s.id)}>
                    {s.active ? 'Pause' : 'Resume'}
                  </button>
                  <button className="btn" type="button" onClick={() => remove(s.id)} style={{ color: '#ef4444' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
