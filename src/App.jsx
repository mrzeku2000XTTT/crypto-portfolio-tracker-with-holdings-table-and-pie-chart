import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchKasPrice } from './lib/api.js';
import BotChat from './components/BotChat.jsx';
import SkillTrainer from './components/SkillTrainer.jsx';
import SubscriptionTracker from './components/SubscriptionTracker.jsx';
import WalletWidget from './components/WalletWidget.jsx';

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'skills', label: 'Skills' },
  { id: 'subs', label: 'Subscriptions' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [price, setPrice] = useState(null);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const mountedRef = useRef(true);

  const loadPrice = useCallback(async () => {
    setRetrying(true);
    try {
      const p = await fetchKasPrice();
      if (!mountedRef.current) return;
      setPrice(p);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      // Keep last good value visible; only surface hard error if we have nothing.
      setError(err && err.message ? err.message : 'Failed to fetch KAS price');
    } finally {
      if (mountedRef.current) setRetrying(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadPrice();
    const id = setInterval(loadPrice, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [loadPrice]);

  const formatUsd = (v) =>
    typeof v === 'number'
      ? '$' + v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })
      : '--';

  return (
    <div className="kb-app">
      <header className="kb-header" style={{ position: 'relative' }}>
        <div className="kb-brand">
          <span className="live-dot" aria-hidden="true" />
          <div className="kb-brand-text">
            <h1>Kaspa Bot</h1>
            <span className="kb-brand-sub">
              {price ? (
                <>
                  KAS {formatUsd(price.usd)}
                  {typeof price.change24h === 'number' && (
                    <span className={price.change24h >= 0 ? 'kb-up' : 'kb-down'}>
                      {' '}
                      {price.change24h >= 0 ? '+' : ''}
                      {price.change24h.toFixed(2)}%
                    </span>
                  )}
                  {retrying && <span className="kb-retry-note"> - retrying...</span>}
                </>
              ) : error ? (
                <span className="kb-down">Price unavailable</span>
              ) : (
                <span className="kb-muted">Loading price...</span>
              )}
            </span>
          </div>
        </div>
        <WalletWidget />
      </header>

      {!price && error && (
        <div className="kb-error-bar">
          <span>{error}</span>
          <button className="btn btn-accent" onClick={loadPrice} disabled={retrying}>
            {retrying ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      <nav className="kb-tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            className={'kb-tab' + (activeTab === t.id ? ' is-active' : '')}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="kb-main">
        {activeTab === 'chat' && <BotChat />}
        {activeTab === 'skills' && <SkillTrainer />}
        {activeTab === 'subs' && <SubscriptionTracker price={price} />}
      </main>
    </div>
  );
}
