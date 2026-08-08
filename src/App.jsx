import React, { useState, useMemo, useCallback } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import HoldingsTable from './components/HoldingsTable.jsx';
import PieChart from './components/PieChart.jsx';
import AddEditModal from './components/AddEditModal.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import { usePrices } from './hooks/usePrices.js';

const INITIAL_HOLDINGS = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin', amount: 0.45 },
  { id: 2, symbol: 'ETH', name: 'Ethereum', amount: 4.2 },
  { id: 3, symbol: 'KAS', name: 'Kaspa', amount: 12500 },
  { id: 4, symbol: 'SOL', name: 'Solana', amount: 18.5 },
  { id: 5, symbol: 'ADA', name: 'Cardano', amount: 3200 },
  { id: 6, symbol: 'DOT', name: 'Polkadot', amount: 420 },
];

const STORAGE_KEY = 'cryptotrack.holdings.v1';

function loadHoldings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_HOLDINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : INITIAL_HOLDINGS;
  } catch {
    return INITIAL_HOLDINGS;
  }
}

export default function App() {
  const [holdings, setHoldings] = useState(loadHoldings);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

  const symbols = useMemo(
    () => [...new Set(holdings.map((h) => h.symbol.toUpperCase()))],
    [holdings]
  );

  const { prices, loading, error, lastUpdated, refresh } = usePrices(symbols);

  const persist = useCallback((next) => {
    setHoldings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }, []);

  const enrichedHoldings = holdings.map((h) => {
    const p = prices[h.symbol.toUpperCase()];
    const hasPrice = !!p;
    const price = hasPrice ? p.price : 0;
    const change24h = hasPrice ? p.change24h : 0;
    return { ...h, price, change24h, value: h.amount * price, hasPrice };
  });

  const totalValue = enrichedHoldings.reduce((s, h) => s + h.value, 0);
  const totalChange = enrichedHoldings.reduce(
    (s, h) => s + h.value * (h.change24h / 100),
    0
  );
  const priced = enrichedHoldings.filter((h) => h.hasPrice);
  const bestPerformer = priced.length
    ? [...priced].sort((a, b) => b.change24h - a.change24h)[0]
    : null;
  const numAssets = holdings.length;
  const showSkeleton = loading && Object.keys(prices).length === 0;

  const handleAdd = () => {
    setEditingHolding(null);
    setModalOpen(true);
  };

  const handleEdit = (holding) => {
    setEditingHolding(holding);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    persist(holdings.filter((h) => h.id !== id));
  };

  const handleSave = ({ id, symbol, name, amount }) => {
    if (id) {
      persist(
        holdings.map((h) => (h.id === id ? { ...h, symbol, name, amount } : h))
      );
    } else {
      persist([...holdings, { id: Date.now(), symbol, name, amount }]);
    }
    setModalOpen(false);
    // pull fresh prices so the new asset gets a live value quickly
    setTimeout(refresh, 0);
  };

  return (
    <div className="app">
      <div className="bg-glow" />
      <div className="container">
        <Header
          lastUpdated={lastUpdated}
          isRefreshing={loading}
          onRefresh={refresh}
        />
        {error && <ErrorBanner message={error} onRetry={refresh} />}
        <SummaryCards
          totalValue={totalValue}
          totalChange={totalChange}
          bestPerformer={bestPerformer}
          numAssets={numAssets}
        />
        <div className="main-grid">
          <HoldingsTable
            holdings={enrichedHoldings}
            totalValue={totalValue}
            loading={showSkeleton}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <PieChart
            holdings={priced}
            totalValue={totalValue}
            loading={showSkeleton}
          />
        </div>
      </div>
      {modalOpen && (
        <AddEditModal
          holding={editingHolding}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
