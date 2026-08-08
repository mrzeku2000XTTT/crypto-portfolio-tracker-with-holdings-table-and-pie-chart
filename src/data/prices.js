// Live price layer backed by CoinGecko. No mock data, ever.

// symbol -> coingecko id
export const SYMBOL_TO_ID = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  KAS: 'kaspa',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  BNB: 'binancecoin',
  XRP: 'ripple',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  DOGE: 'dogecoin',
  TRX: 'tron',
  SHIB: 'shiba-inu',
  XLM: 'stellar',
  NEAR: 'near',
  APT: 'aptos',
};

export const COIN_NAMES = {
  BTC: 'Bitcoin', ETH: 'Ethereum', KAS: 'Kaspa', SOL: 'Solana',
  ADA: 'Cardano', DOT: 'Polkadot', BNB: 'BNB', XRP: 'XRP',
  AVAX: 'Avalanche', MATIC: 'Polygon', LINK: 'Chainlink',
  UNI: 'Uniswap', ATOM: 'Cosmos', LTC: 'Litecoin', DOGE: 'Dogecoin',
  TRX: 'TRON', SHIB: 'Shiba Inu', XLM: 'Stellar', NEAR: 'NEAR', APT: 'Aptos',
};

export const KNOWN_COINS = Object.keys(SYMBOL_TO_ID);

export function idForSymbol(symbol) {
  return SYMBOL_TO_ID[String(symbol).toUpperCase()] || null;
}

// Fetch live USD price + 24h change for the given symbols from CoinGecko.
// Returns { SYMBOL: { price, change24h } } for every symbol that resolved.
export async function fetchPrices(symbols) {
  const pairs = symbols
    .map((s) => [String(s).toUpperCase(), idForSymbol(s)])
    .filter(([, id]) => !!id);

  if (pairs.length === 0) return {};

  const ids = [...new Set(pairs.map(([, id]) => id))].join(',');
  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
    `&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
  const data = await res.json();

  const result = {};
  for (const [sym, id] of pairs) {
    const row = data[id];
    if (row && typeof row.usd === 'number') {
      result[sym] = {
        price: row.usd,
        change24h: typeof row.usd_24h_change === 'number' ? row.usd_24h_change : 0,
      };
    }
  }
  return result;
}
