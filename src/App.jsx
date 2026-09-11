import React, { useState } from 'react';
import useWallet from './hooks/useWallet.js';
import WalletWidget from './components/WalletWidget.jsx';
import BalanceCard from './components/BalanceCard.jsx';
import SendTab from './components/SendTab.jsx';
import ReceiveTab from './components/ReceiveTab.jsx';
import HistoryTab from './components/HistoryTab.jsx';

const TABS = ['Send', 'Receive', 'History'];

export default function App() {
  const wallet = useWallet();
  const [tab, setTab] = useState('Send');

  return (
    <div className="app">
      <header className="app-header" style={{ position: 'relative' }}>
        <div className="app-title">
          <span className="app-mark" aria-hidden="true">◈</span>
          <h1>Kaspa Wallet</h1>
        </div>
        <WalletWidget wallet={wallet} />
      </header>

      <main className="app-main">
        <BalanceCard state={wallet.state} price={wallet.price} connect={wallet.connect} loading={wallet.loading} refresh={wallet.refresh} />

        <div className="tabs" role="tablist" aria-label="Wallet actions">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab${tab === t ? ' active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="tab-panel" role="tabpanel">
          {tab === 'Send' && (
            <SendTab
              state={wallet.state}
              price={wallet.price}
              send={wallet.send}
              isValidAddress={wallet.isValidAddress}
              explorerUrl={wallet.explorerUrl}
              connect={wallet.connect}
              loading={wallet.loading}
            />
          )}
          {tab === 'Receive' && (
            <ReceiveTab
              state={wallet.state}
              receiveQR={wallet.receiveQR}
              receiveURI={wallet.receiveURI}
              connect={wallet.connect}
            />
          )}
          {tab === 'History' && (
            <HistoryTab
              state={wallet.state}
              getTransactions={wallet.getTransactions}
              explorerUrl={wallet.explorerUrl}
              connect={wallet.connect}
            />
          )}
        </section>
      </main>
    </div>
  );
}
