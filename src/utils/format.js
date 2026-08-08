export function fmt(val) {
  if (val === undefined || val === null || isNaN(val)) return '$0.00';
  if (val >= 1e9) return '$' + (val / 1e9).toFixed(2) + 'B';
  if (val >= 1e6) return '$' + (val / 1e6).toFixed(2) + 'M';
  if (val >= 1000) return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (val >= 1) return '$' + val.toFixed(2);
  if (val >= 0.001) return '$' + val.toFixed(4);
  return '$' + val.toFixed(6);
}

export function fmtPct(val) {
  if (isNaN(val)) return '0.00%';
  return Math.abs(val).toFixed(2) + '%';
}

export function fmtCoin(val) {
  if (isNaN(val)) return '0';
  if (val >= 1000000) return (val / 1e6).toFixed(2) + 'M';
  if (val >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (val >= 1) return val.toFixed(4);
  return val.toFixed(6);
}
