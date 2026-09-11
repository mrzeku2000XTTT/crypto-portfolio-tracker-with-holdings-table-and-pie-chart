import React, { useState, useEffect, useCallback } from 'react';

function shortAddr(a) {
  if (!a) return '';
  if (a.length <= 16) return a;
  return `${a.slice(0, 10)}…${a.slice(-4)}`;
}

function fmtKas(v) {
  const n = Number(v) || 0;
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export default function WalletWidget({ wallet }) {
  const { state, connect, createWallet, importWallet, disconnect, forget, exportMnemonic, exportPrivateKey, loading, error } = wallet;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('overview');
  const [seed, setSeed] = useState('');
  const [seedAck, setSeedAck] = useState(false);
  const [importVal, setImportVal] = useState('');
  const [localMsg, setLocalMsg] = useState('');
  const [secret, setSecret] = useState(null); // {kind,value}

  const connected = state && state.connected;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); setSecret(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSecret(null);
    setSeed('');
    setSeedAck(false);
    setLocalMsg('');
  }, []);

  const toggle = () => setOpen((o) => !o);

  const doConnect = async () => {
    setLocalMsg('');
    try { await connect(); } catch (e) { /* error surfaced below */ }
  };

  const doCreate = async () => {
    setLocalMsg('');
    setSeed('');
    setSeedAck(false);
    try {
      const res = await createWallet();
      if (res && res.mnemonic) {
        setSeed(res.mnemonic);
        setTab('overview');
      }
    } catch (e) { /* surfaced */ }
  };

  const doImport = async () => {
    setLocalMsg('');
    const m = importVal.trim();
    if (!m) { setLocalMsg('Enter your seed phrase.'); return; }
    try {
      await importWallet(m);
      setImportVal('');
      setTab('overview');
    } catch (e) { /* surfaced */ }
  };

  const revealSecret = async (kind) => {
    setLocalMsg('');
    try {
      let value = '';
      if (kind === 'seed') value = await exportMnemonic();
      else value = exportPrivateKey ? await exportPrivateKey() : '';
      if (!value) { setLocalMsg('Not available for this wallet.'); return; }
      setSecret({ kind, value });
    } catch (e) {
      setLocalMsg(e && e.message ? e.message : 'Export failed.');
    }
  };

  const copy = (text) => {
    try { navigator.clipboard.writeText(text); setLocalMsg('Copied to clipboard.'); }
    catch (e) { setLocalMsg('Copy failed — select and copy manually.'); }
  };

  const isWatch = state && state.mode === 'watch';

  return (
    <div className="wallet-widget">
      <button
        data-ttt-wallet
        className="pill"
        onClick={toggle}
        aria-expanded={open}
        aria-label="TTT Kaspa wallet"
      >
        <span className="pill-dot" aria-hidden="true" />
        {connected
          ? <span className="pill-text">{shortAddr(state.address)} · {fmtKas(state.balance)} KAS</span>
          : <span className="pill-text">TTT Kaspa · Connect</span>}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={close} />
          <div className="wallet-panel" data-ttt-wallet>
            <div className="wallet-panel-head">
              <strong>TTT Kaspa</strong>
              <button className="icon-btn" onClick={close} aria-label="Close">✕</button>
            </div>

            {!connected ? (
              <div className="wallet-panel-body">
                <p className="muted small">Create a new wallet or import an existing seed phrase.</p>
                <button className="btn btn-accent full" onClick={doCreate} disabled={loading}>Create new wallet</button>
                <button className="btn full" onClick={doConnect} disabled={loading}>Load saved wallet</button>

                {seed && (
                  <div className="seed-box">
                    <p className="warn">Save this phrase. It cannot be recovered.</p>
                    <code className="seed-words">{seed}</code>
                    <div className="row">
                      <button className="btn small" onClick={() => copy(seed)}>Copy</button>
                      <label className="chk">
                        <input type="checkbox" checked={seedAck} onChange={(e) => setSeedAck(e.target.checked)} />
                        I saved it
                      </label>
                    </div>
                  </div>
                )}

                <div className="divider" />
                <label className="field-label">Import seed phrase</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="word1 word2 word3 …"
                  value={importVal}
                  onChange={(e) => setImportVal(e.target.value)}
                />
                <button className="btn full" onClick={doImport} disabled={loading}>Import wallet</button>
              </div>
            ) : (
              <div className="wallet-panel-body">
                <div className="seg">
                  {['overview', 'export'].map((t) => (
                    <button key={t} className={`seg-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                      {t === 'overview' ? 'Overview' : 'Export'}
                    </button>
                  ))}
                </div>

                {tab === 'overview' && (
                  <div>
                    <div className="kv"><span className="muted small">Address</span></div>
                    <div className="addr-row">
                      <code className="addr">{state.address}</code>
                      <button className="btn small" onClick={() => copy(state.address)}>Copy</button>
                    </div>
                    <div className="kv big">
                      <span>{fmtKas(state.balance)} KAS</span>
                    </div>
                    {isWatch && <p className="muted small">Watch-only wallet.</p>}

                    {seed && (
                      <div className="seed-box">
                        <p className="warn">Save this phrase. It cannot be recovered.</p>
                        <code className="seed-words">{seed}</code>
                        <button className="btn small" onClick={() => copy(seed)}>Copy</button>
                      </div>
                    )}

                    <div className="divider" />
                    <button className="btn full" onClick={disconnect} disabled={loading}>Disconnect</button>
                    <button className="btn full danger" onClick={forget} disabled={loading}>Forget wallet</button>
                  </div>
                )}

                {tab === 'export' && (
                  <div>
                    <p className="warn">Anyone with these secrets controls your funds. Never share them.</p>
                    {isWatch ? (
                      <p className="muted small">Export not available for watch-only wallets.</p>
                    ) : (
                      <>
                        <button className="btn full" onClick={() => revealSecret('seed')}>Export seed phrase</button>
                        <button className="btn full" onClick={() => revealSecret('key')}>Export private key</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {(error || localMsg) && (
              <div className="wallet-msg">{error || localMsg}</div>
            )}
            <div className="wallet-note">Keys generated locally in this browser. Never sent to any server.</div>
          </div>
        </>
      )}

      {secret && (
        <>
          <div className="modal-backdrop" onClick={() => setSecret(null)} />
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <strong>{secret.kind === 'seed' ? 'Seed phrase' : 'Private key'}</strong>
              <button className="icon-btn" onClick={() => setSecret(null)} aria-label="Close">✕</button>
            </div>
            <p className="warn">Keep this secret. Never share it with anyone.</p>
            <code className="seed-words">{secret.value}</code>
            <div className="row">
              <button className="btn small" onClick={() => copy(secret.value)}>Copy</button>
              <button className="btn small" onClick={() => setSecret(null)}>Done</button>
            </div>
            <div className="wallet-note">Keys generated locally in this browser. Never sent to any server.</div>
          </div>
        </>
      )}
    </div>
  );
}
