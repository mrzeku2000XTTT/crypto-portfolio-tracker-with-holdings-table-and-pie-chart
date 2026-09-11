import React, { useEffect, useRef, useState } from 'react';

const short = (a) => (a && a.length > 16 ? `${a.slice(0, 10)}...${a.slice(-4)}` : a || '');

export default function WalletWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('receive');
  const [state, setState] = useState({ address: '', connected: false, balance: 0, mode: '' });
  const [price, setPrice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // receive
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  // send
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [txId, setTxId] = useState('');
  // onboarding / import
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [newSeed, setNewSeed] = useState('');
  // export
  const [reveal, setReveal] = useState({ type: '', value: '' });

  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const w = window.TTTWallet;
    let unsub = () => {};
    if (w) {
      try {
        const s = w.getState ? w.getState() : {};
        if (s) setState((p) => ({ ...p, ...s }));
      } catch (e) { /* ignore */ }
      if (w.onChange) {
        unsub = w.onChange((s) => {
          if (mounted.current && s) setState((p) => ({ ...p, ...s }));
        });
      }
      if (w.getPrice) {
        w.getPrice().then((p) => { if (mounted.current) setPrice(p); }).catch(() => {});
      }
    }
    return () => { mounted.current = false; try { unsub && unsub(); } catch (e) {} };
  }, []);

  const guard = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e && e.message ? e.message : String(e));
    } finally {
      if (mounted.current) setBusy(false);
    }
  };

  const connect = () => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    await w.connect();
  });

  const createWallet = () => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    const res = await w.createWallet();
    if (res && res.mnemonic) setNewSeed(res.mnemonic);
  });

  const importWallet = () => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    const m = mnemonicInput.trim();
    if (!m) throw new Error('Enter your seed phrase.');
    await w.importWallet(m);
    setMnemonicInput('');
  });

  const makeQr = () => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    const url = await w.receiveQR();
    if (mounted.current) setQr(url);
  });

  useEffect(() => {
    if (open && tab === 'receive' && state.connected && !qr) {
      makeQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, state.connected]);

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(state.address || '');
      setCopied(true);
      setTimeout(() => mounted.current && setCopied(false), 1500);
    } catch (e) { setError('Could not copy address.'); }
  };

  const doSend = () => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    const addr = to.trim();
    if (!w.isValidAddress || !w.isValidAddress(addr)) throw new Error('Invalid Kaspa address.');
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error('Enter a valid amount.');
    const id = await w.send(addr, amt);
    if (mounted.current) { setTxId(id); setAmount(''); setTo(''); }
  });

  const doExport = (type) => guard(async () => {
    const w = window.TTTWallet;
    if (!w) throw new Error('Wallet kit not loaded.');
    let value = '';
    if (type === 'mnemonic') {
      if (!w.exportMnemonic) throw new Error('Not available for this wallet.');
      value = await w.exportMnemonic();
    } else {
      if (!w.exportPrivateKey) throw new Error('Not available for this wallet.');
      value = await w.exportPrivateKey();
    }
    if (!value) throw new Error('Not available for this wallet.');
    if (mounted.current) setReveal({ type, value });
  });

  const close = () => {
    setOpen(false);
    setReveal({ type: '', value: '' });
    setNewSeed('');
    setTxId('');
    setError('');
  };

  const usdBal = price && typeof price.usd === 'number' ? (Number(state.balance) || 0) * price.usd : null;
  const explorer = txId && window.TTTWallet && window.TTTWallet.explorerUrl ? window.TTTWallet.explorerUrl(txId) : '';

  const panelStyle = {
    position: 'absolute', top: '100%', right: 0, width: 320, maxHeight: '80vh',
    overflowY: 'auto', zIndex: 50, marginTop: 8,
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: 16,
  };

  return (
    <>
      <button
        data-ttt-wallet
        className="btn pill"
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <span className="live-dot" style={{ background: state.connected ? 'var(--accent)' : 'var(--muted)' }} />
        {state.connected
          ? <span>{short(state.address)} - {(Number(state.balance) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS</span>
          : <span>TTT Kaspa - Connect</span>}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={close} />
          <div data-ttt-wallet style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>TTT Kaspa</strong>
              <button className="btn" onClick={close} aria-label="Close" style={{ padding: '2px 10px' }}>X</button>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{error}</div>}

            {!state.connected ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <button className="btn btn-accent" onClick={connect} disabled={busy}>Connect / load wallet</button>
                <button className="btn" onClick={createWallet} disabled={busy}>Create new wallet</button>
                {newSeed && (
                  <div className="card" style={{ borderColor: '#f59e0b' }}>
                    <div style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600 }}>Save this seed phrase - it cannot be recovered.</div>
                    <code style={{ display: 'block', marginTop: 8, wordBreak: 'break-word', fontSize: 13 }}>{newSeed}</code>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Or import existing:</div>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Enter 12/24-word seed phrase"
                    value={mnemonicInput}
                    onChange={(e) => setMnemonicInput(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                  <button className="btn" onClick={importWallet} disabled={busy} style={{ marginTop: 8 }}>Import wallet</button>
                </div>
              </div>
            ) : (
              <>
                <div className="card" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Balance</div>
                  <strong style={{ fontSize: 20 }}>{(Number(state.balance) || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} KAS</strong>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{usdBal === null ? '-' : `$${usdBal.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</div>
                </div>

                <div className="kb-tabs" style={{ marginBottom: 12 }}>
                  {['receive', 'send', 'export'].map((t) => (
                    <button key={t} className={`kb-tab${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); setReveal({ type: '', value: '' }); }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                {tab === 'receive' && (
                  <div style={{ textAlign: 'center' }}>
                    {qr ? <img src={qr} alt="Receive QR" style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }} /> : <div className="kb-progress" style={{ width: 180, height: 180, margin: '0 auto', borderRadius: 12 }} />}
                    <code style={{ display: 'block', marginTop: 10, wordBreak: 'break-word', fontSize: 12 }}>{state.address}</code>
                    <button className="btn" onClick={copyAddr} style={{ marginTop: 8 }}>{copied ? 'Copied!' : 'Copy address'}</button>
                  </div>
                )}

                {tab === 'send' && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <input className="input" placeholder="kaspa:q..." value={to} onChange={(e) => setTo(e.target.value)} />
                    <input className="input" type="number" step="any" min="0" placeholder="Amount (KAS)" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <button className="btn btn-accent" onClick={doSend} disabled={busy}>{busy ? 'Sending...' : 'Send'}</button>
                    {txId && (
                      <div style={{ fontSize: 13 }}>
                        Sent! <a href={explorer} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>View on explorer</a>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'export' && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 13, color: '#f59e0b' }}>Keep this secret. Never share it with anyone.</div>
                    <button className="btn" onClick={() => doExport('mnemonic')} disabled={busy}>Export seed phrase</button>
                    <button className="btn" onClick={() => doExport('private')} disabled={busy}>Export private key</button>
                    {reveal.value && (
                      <div className="card" style={{ borderColor: '#f59e0b' }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{reveal.type === 'mnemonic' ? 'Seed phrase' : 'Private key'}</div>
                        <code style={{ display: 'block', marginTop: 6, wordBreak: 'break-word', fontSize: 12 }}>{reveal.value}</code>
                        <button className="btn" onClick={() => setReveal({ type: '', value: '' })} style={{ marginTop: 8 }}>Hide</button>
                      </div>
                    )}
                    <button className="btn" onClick={() => guard(async () => { const w = window.TTTWallet; if (w && w.disconnect) await w.disconnect(); })} style={{ color: '#ef4444' }}>Disconnect</button>
                  </div>
                )}
              </>
            )}

            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
              Keys generated locally in this browser. Never sent to any server.
            </div>
          </div>
        </>
      )}
    </>
  );
}
