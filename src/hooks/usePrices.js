import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPrices } from '../data/prices.js';

const REFRESH_MS = 30000;

// Live prices for a set of symbols. Fetches on mount + every 30s.
export function usePrices(symbols) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // keep latest symbols without retriggering the interval effect
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError(null);
    try {
      const data = await fetchPrices(symbolsRef.current);
      if (!mountedRef.current) return;
      setPrices((prev) => ({ ...prev, ...data }));
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Failed to load prices');
      setLoading(false);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [load]);

  return { prices, loading, error, lastUpdated, refresh: load };
}
