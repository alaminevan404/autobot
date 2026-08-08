// src/paper-trading.js
// Simulated paper trading engine. Maintains simulated P/L and returns trade objects.

import Storage from './storage.js';

const DEFAULT_PAYOUT = 0.8;

export async function openSimulatedTrade({ signal, asset, timeframe, amount=10, confidence=0.5 }={}){
  // Very simple probabilistic model: chance to win based on confidence, adjusted by small randomness.
  amount = Number(amount)||1; confidence = Math.max(0.01, Math.min(0.98, Number(confidence)||0.5));
  // Simulate expiry delay for UX without blocking
  await new Promise(r=>setTimeout(r, 600 + Math.floor(Math.random()*900)));
  const win = Math.random() < confidence;
  const pl = win ? Number((amount * DEFAULT_PAYOUT).toFixed(2)) : -amount;
  const trade = { time: Date.now(), asset, timeframe, signal, confidence, result: win? 'WIN':'LOSS', pl };
  // Update storage
  const st = Storage.getState(); st.tradeHistory.push(trade); st.demoBalance = Number(st.demoBalance) + Number(pl); Storage.saveState(st);
  return trade;
}

export default { openSimulatedTrade };
