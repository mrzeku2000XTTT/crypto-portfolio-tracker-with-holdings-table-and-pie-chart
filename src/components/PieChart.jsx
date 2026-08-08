import React, { useState, useEffect, useRef } from 'react';
import { fmt } from '../utils/format.js';

const COLORS = [
  '#70C7BA','#58a6ff','#3fb950','#bc8cff',
  '#ffa657','#ff79c6','#f85149','#d29922',
  '#79c0ff','#56d364',
];

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
  const s = polarToXY(cx, cy, r, startAngle);
  const e = polarToXY(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y} Z`;
}

export default function PieChart({ holdings, totalValue, loading }) {
  const [hovered, setHovered] = useState(null);
  const [animPct, setAnimPct] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    setAnimPct(0);
    const start = performance.now();
    const duration = 700;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimPct(ease);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [holdings.length]);

  const cx = 110, cy = 110, r = 90, inner = 52;
  let cumAngle = 0;

  const slices = holdings.map((h, i) => {
    const pct = totalValue > 0 ? h.value / totalValue : 0;
    const angle = pct * 360 * animPct;
    const start = cumAngle;
    cumAngle += angle;
    return { ...h, pct, start, end: cumAngle, color: COLORS[i % COLORS.length] };
  });

  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="panel pie-panel">
      <div className="panel-header">
        <div className="panel-title">🥧 Allocation</div>
      </div>
      <div className="pie-body">
        {loading ? (
          <div className="pie-skeleton">
            <div className="skeleton skeleton-circle" />
            <div className="pie-skeleton-legend">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-line" />
              ))}
            </div>
          </div>
        ) : slices.length === 0 ? (
          <div className="pie-empty">No priced assets to chart yet.</div>
        ) : (
          <>
            <svg viewBox="0 0 220 220" className="pie-svg">
              {slices.map((s, i) => (
                <path
                  key={s.id}
                  d={slicePath(cx, cy, r, s.start, s.end)}
                  fill={s.color}
                  opacity={hovered === null || hovered === i ? 1 : 0.35}
                  stroke="#0d1117"
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <circle cx={cx} cy={cy} r={inner} fill="#161b22" />
              {active ? (
                <>
                  <text x={cx} y={cy - 10} textAnchor="middle" fill="#e6edf3" fontSize="13" fontWeight="700">{active.symbol}</text>
                  <text x={cx} y={cy + 8} textAnchor="middle" fill="#70C7BA" fontSize="12">{(active.pct * 100).toFixed(1)}%</text>
                  <text x={cx} y={cy + 24} textAnchor="middle" fill="#8b949e" fontSize="10">{fmt(active.value)}</text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy - 4} textAnchor="middle" fill="#8b949e" fontSize="10">Total</text>
                  <text x={cx} y={cy + 12} textAnchor="middle" fill="#e6edf3" fontSize="11" fontWeight="700">{fmt(totalValue)}</text>
                </>
              )}
            </svg>

            <div className="pie-legend">
              {slices.map((s, i) => (
                <div
                  key={s.id}
                  className={`legend-item ${hovered === i ? 'legend-active' : ''}`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="legend-dot" style={{ background: s.color }} />
                  <div className="legend-info">
                    <span className="legend-sym">{s.symbol}</span>
                    <span className="legend-pct">{(s.pct * 100).toFixed(1)}%</span>
                  </div>
                  <div className="legend-val">{fmt(s.value)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
