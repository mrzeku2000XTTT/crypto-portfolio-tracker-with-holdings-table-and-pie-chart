// Resilient live KAS price fetcher.
// Tries multiple CORS-friendly sources in order; only throws if ALL fail.
// Returns { usd:number, change24h:number, source:string, updatedAt:number }.
// NEVER returns a hardcoded / invented price.

function withTimeout(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

async function getJson(url, ms = 8000) {
  const t = withTimeout(ms);
  try {
    const res = await fetch(url, { signal: t.signal, headers: { accept: 'application/json' } });
    if (!res.ok) {
      let body = '';
      try { body = (await res.text()).slice(0, 160); } catch (e) { /* ignore */ }
      throw new Error(`HTTP ${res.status} from ${url}${body ? ' - ' + body : ''}`);
    }
    return await res.json();
  } finally {
    t.done();
  }
}

// 1) CoinCap - very reliable, CORS open. PRIMARY.
async function fromCoinCap() {
  const data = await getJson('https://api.coincap.io/v2/assets/kaspa');
  const a = data && data.data;
  const usd = a ? parseFloat(a.priceUsd) : NaN;
  const change24h = a ? parseFloat(a.changePercent24Hr) : NaN;
  if (!Number.isFinite(usd)) throw new Error('CoinCap returned no usable price');
  return {
    usd,
    change24h: Number.isFinite(change24h) ? change24h : 0,
    source: 'CoinCap',
    updatedAt: Date.now(),
  };
}

// 2) Binance per-symbol ticker.
async function fromBinance() {
  const t = await getJson('https://api.binance.com/api/v3/ticker/24hr?symbol=KASUSDT');
  const usd = parseFloat(t.lastPrice);
  const change24h = parseFloat(t.priceChangePercent);
  if (!Number.isFinite(usd)) throw new Error('Binance returned no usable price');
  return {
    usd,
    change24h: Number.isFinite(change24h) ? change24h : 0,
    source: 'Binance',
    updatedAt: Date.now(),
  };
}

// 3) CoinGecko simple price.
async function fromCoinGecko() {
  const j = await getJson(
    'https://api.coingecko.com/api/v3/simple/price?ids=kaspa&vs_currencies=usd&include_24hr_change=true'
  );
  const k = j && j.kaspa;
  const usd = k ? Number(k.usd) : NaN;
  const change24h = k ? Number(k.usd_24h_change) : NaN;
  if (!Number.isFinite(usd)) throw new Error('CoinGecko returned no usable price');
  return {
    usd,
    change24h: Number.isFinite(change24h) ? change24h : 0,
    source: 'CoinGecko',
    updatedAt: Date.now(),
  };
}

export async function fetchKasPrice() {
  const sources = [fromCoinCap, fromBinance, fromCoinGecko];
  const errors = [];
  for (const src of sources) {
    try {
      const price = await src();
      if (price && Number.isFinite(price.usd)) return price;
    } catch (err) {
      errors.push(err && err.message ? err.message : String(err));
    }
  }
  throw new Error(
    'Could not fetch a live KAS price from any source. ' + errors.join(' | ')
  );
}

export default fetchKasPrice;
