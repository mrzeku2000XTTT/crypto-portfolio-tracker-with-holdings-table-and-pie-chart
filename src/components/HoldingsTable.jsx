import React, { useState } from 'react';
import { fmt, fmtPct, fmtCoin } from '../utils/format.js';

const COIN_COLORS = [
  '#70C7BA','#58a6ff','#3fb950','#bc8cff',
  '#ffa657','#ff79c6','#f85149','#d29922',
  '#79c0ff','#56d364',
];

function SkeletonRows({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={`sk-${i}`} className="holding-row">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j}>
          <div className="skeleton" />
        </td>
      ))}
    </tr>
  ));
}

export default function HoldingsTable({
  holdings,
  totalValue,
  loading,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [sortKey, setSortKey] = useState('value');
  const [sortDir, setSortDir] = useState('desc');
  const [confirm, setConfirm] = useState(null);

  const sorted = [...holdings].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }) => (
    <span className="sort-icon">
      {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">📋 Holdings</div>
        <button className="add-btn" onClick={onAdd}>+ Add Asset</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Asset <SortIcon k="name" />
              </th>
              <th onClick={() => handleSort('price')} className="sortable">
                Price <SortIcon k="price" />
              </th>
              <th onClick={() => handleSort('change24h')} className="sortable">
                24h % <SortIcon k="change24h" />
              </th>
              <th onClick={() => handleSort('amount')} className="sortable">
                Holdings <SortIcon k="amount" />
              </th>
              <th onClick={() => handleSort('value')} className="sortable">
                Value <SortIcon k="value" />
              </th>
              <th>Alloc</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows />}
            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-cell">
                  No assets yet — add one to start tracking.
                </td>
              </tr>
            )}
            {!loading && sorted.map((h, i) => {
              const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
              const color = COIN_COLORS[i % COIN_COLORS.length];
              const isPos = h.change24h >= 0;
              return (
                <tr key={h.id} className="holding-row">
                  <td>
                    <div className="coin-cell">
                      <div className="coin-dot" style={{ background: color }} />
                      <div>
                        <div className="coin-symbol">{h.symbol}</div>
                        <div className="coin-name">{h.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">
                    {h.hasPrice ? fmt(h.price) : <span className="muted">—</span>}
                  </td>
                  <td className={`num ${h.hasPrice ? (isPos ? 'positive' : 'negative') : ''}`}>
                    {h.hasPrice
                      ? `${isPos ? '+' : ''}${fmtPct(h.change24h)}`
                      : <span className="muted">—</span>}
                  </td>
                  <td className="num">{fmtCoin(h.amount)} {h.symbol}</td>
                  <td className="num bold">
                    {h.hasPrice ? fmt(h.value) : <span className="muted">n/a</span>}
                  </td>
                  <td>
                    <div className="alloc-cell">
                      <div className="alloc-bar-wrap">
                        <div className="alloc-bar" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="alloc-pct">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      {confirm === h.id ? (
                        <>
                          <button className="action-btn confirm" onClick={() => { onDelete(h.id); setConfirm(null); }}>✓</button>
                          <button className="action-btn cancel" onClick={() => setConfirm(null)}>✗</button>
                        </>
                      ) : (
                        <>
                          <button className="action-btn edit" onClick={() => onEdit(h)}>✎</button>
                          <button className="action-btn delete" onClick={() => setConfirm(h.id)}>🗑</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
