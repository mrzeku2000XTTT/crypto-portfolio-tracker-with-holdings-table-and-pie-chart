import { useState, useEffect, useCallback, useRef } from 'react';

const EMPTY_STATE = { address: null, mode: null, connected: false, balance: 0 };

function getKit() {
  return typeof window !== 'undefined' ? window.TTTWallet : null;
}

export default function useWallet() {
  const [state, setState] = useState(EMPTY_STATE);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const loadPrice = useCallback(async () => {
    const kit = getKit();
    if (!kit) return;
    try {
      const p = await kit.getPrice();
      if (mounted.current && typeof p === 'number' && !Number.isNaN(p)) setPrice(p);
    } catch (e) {
      // price is non-critical; keep last known value
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const kit = getKit();
    if (!kit) {
      setError('Kaspa wallet kit not loaded.');
      return () => { mounted.current = false; };
    }

    let unsub = () => {};
    try {
      const current = kit.getState ? kit.getState() : null;
      if (current) setState({ ...EMPTY_STATE, ...current });
    } catch (e) { /* ignore */ }

    try {
      unsub = kit.onChange((s) => {
        if (mounted.current && s) setState({ ...EMPTY_STATE, ...s });
      }) || (() => {});
    } catch (e) {
      setError(e && e.message ? e.message : 'Failed to subscribe to wallet.');
    }

    loadPrice();
    const priceTimer = setInterval(loadPrice, 60000);

    return () => {
      mounted.current = false;
      clearInterval(priceTimer);
      try { unsub(); } catch (e) { /* ignore */ }
    };
  }, [loadPrice]);

  const run = useCallback(async (fn) => {
    const kit = getKit();
    if (!kit) throw new Error('Kaspa wallet kit not loaded.');
    setLoading(true);
    setError('');
    try {
      const res = await fn(kit);
      return res;
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      setError(msg);
      throw e;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const connect = useCallback(() => run((k) => k.connect()), [run]);
  const createWallet = useCallback(() => run((k) => k.createWallet()), [run]);
  const importWallet = useCallback((m) => run((k) => k.importWallet(m)), [run]);
  const send = useCallback((to, amt) => run((k) => k.send(to, amt)), [run]);
  const disconnect = useCallback(() => run((k) => k.disconnect()), [run]);
  const forget = useCallback(() => run((k) => k.forget()), [run]);
  const exportMnemonic = useCallback(() => run((k) => k.exportMnemonic()), [run]);
  const exportPrivateKey = useCallback(() => run((k) => k.exportPrivateKey()), [run]);
  const getTransactions = useCallback(() => run((k) => k.getTransactions()), [run]);
  const receiveQR = useCallback((amt) => run((k) => k.receiveQR(amt)), [run]);
  const receiveURI = useCallback(() => run((k) => k.receiveURI()), [run]);

  const isValidAddress = useCallback((a) => {
    const kit = getKit();
    if (!kit || !kit.isValidAddress) return false;
    try { return kit.isValidAddress(a); } catch (e) { return false; }
  }, []);

  const explorerUrl = useCallback((txId) => {
    const kit = getKit();
    if (!kit || !kit.explorerUrl) return '#';
    try { return kit.explorerUrl(txId); } catch (e) { return '#'; }
  }, []);

  const refresh = useCallback(async () => {
    const kit = getKit();
    if (kit && kit.refreshBalance) {
      try { await kit.refreshBalance(); } catch (e) { /* ignore */ }
    }
    await loadPrice();
  }, [loadPrice]);

  return {
    state,
    price,
    loading,
    error,
    connect,
    createWallet,
    importWallet,
    send,
    disconnect,
    forget,
    exportMnemonic,
    exportPrivateKey,
    getTransactions,
    receiveQR,
    receiveURI,
    isValidAddress,
    explorerUrl,
    refresh,
  };
}
