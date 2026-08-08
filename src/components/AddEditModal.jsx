import React, { useState, useEffect } from 'react';
import { KNOWN_COINS, COIN_NAMES } from '../data/prices.js';

export default function AddEditModal({ holding, onSave, onClose }) {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (holding) {
      setSymbol(holding.symbol);
      setName(holding.name);
      setAmount(String(holding.amount));
    }
  }, [holding]);

  const handleSymbolChange = (val) => {
    const up = val.toUpperCase();
    setSymbol(up);
    if (COIN_NAMES[up] && !holding) setName(COIN_NAMES[up]);
  };

  const validate = () => {
    const e = {};
    if (!symbol.trim()) e.symbol = 'Symbol is required';
    if (!name.trim()) e.name = 'Name is required';
    if (!amount || isNaN(amount) || Number(amount) <= 0) e.amount = 'Enter a valid positive amount';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSave({ id: holding?.id || null, symbol: symbol.trim().toUpperCase(), name: name.trim(), amount: Number(amount) });
  };

  const known = KNOWN_COINS.includes(symbol.trim().toUpperCase());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{holding ? 'Edit Asset' : 'Add Asset'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Symbol</label>
            <input
              list="coin-list"
              value={symbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              placeholder="BTC, ETH, KAS…"
              className={errors.symbol ? 'error' : ''}
              disabled={!!holding}
            />
            <datalist id="coin-list">
              {KNOWN_COINS.map((c) => <option key={c} value={c}>{COIN_NAMES[c]}</option>)}
            </datalist>
            {errors.symbol && <span className="form-error">{errors.symbol}</span>}
            {!errors.symbol && symbol.trim() && !known && (
              <span className="form-hint">Not in the live price list — value will show as n/a.</span>
            )}
          </div>
          <div className="form-group">
            <label>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bitcoin"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">{holding ? 'Update' : 'Add'} Asset</button>
          </div>
        </form>
      </div>
    </div>
  );
}
