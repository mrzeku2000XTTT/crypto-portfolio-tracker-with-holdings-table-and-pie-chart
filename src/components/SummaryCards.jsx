import React from 'react';
import { fmt, fmtPct } from '../utils/format.js';

export default function SummaryCards({ totalValue, totalChange, bestPerformer, numAssets }) {
  const changePct = totalValue > 0 ? (totalChange / (totalValue - totalChange)) * 100 : 0;
  const isPositive = totalChange >= 0;

  return (
    <div className="summary-grid">
      <div className="summary-card" style={{ '--card-accent': '#70C7BA' }}>
        <span className="summary-icon">💼</span>
        <div className="summary-label">Total Portfolio Value</div>
        <div className="summary-value">{fmt(totalValue)}</div>
        <div className={`summary-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {fmt(Math.abs(totalChange))} ({fmtPct(Math.abs(changePct))})
        </div>
      </div>

      <div className="summary-card" style={{ '--card-accent': '#58a6ff' }}>
        <span className="summary-icon">📊</span>
        <div className="summary-label">24h Change</div>
        <div className={`summary-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{fmt(totalChange)}
        </div>
        <div className={`summary-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'} {fmtPct(Math.abs(changePct))} today
        </div>
      </div>

      <div className="summary-card" style={{ '--card-accent': '#3fb950' }}>
        <span className="summary-icon">🏆</span>
        <div className="summary-label">Best Performer</div>
        <div className="summary-value" style={{ fontSize: '20px' }}>
          {bestPerformer ? bestPerformer.symbol : '—'}
        </div>
        <div className="summary-change positive">
          {bestPerformer ? `▲ ${fmtPct(bestPerformer.change24h)} today` : '—'}
        </div>
      </div>

      <div className="summary-card" style={{ '--card-accent': '#bc8cff' }}>
        <span className="summary-icon">🪙</span>
        <div className="summary-label">Assets Tracked</div>
        <div className="summary-value">{numAssets}</div>
        <div className="summary-change neutral">coins in portfolio</div>
      </div>
    </div>
  );
}
