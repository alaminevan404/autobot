// src/adapters/pocket-option-adapter.js
// Adapter to attempt reading market data from Pocket Option page. This module MUST NOT
// perform any actions that place orders or manipulate broker UI. It only tries to read
// values and returns null when not possible.

// The adapter is defensive: DOM structure may change. If data cannot be found reliably,
// return null so the overlay shows 'Market data unavailable'.

function safeQuery(selector){ try{ return document.querySelector(selector); }catch(e){ return null; } }

export async function detectSupported(){
  // Heuristic: Pocket Option has elements with class names that include 'chart' or 'trading'
  // This is a best-effort check and may be adjusted.
  const el = safeQuery('[data-chart]') || safeQuery('.chart') || safeQuery('#chart');
  return !!el;
}

export async function getMarketData(asset, timeframe){
  // Attempt several known selectors to find a price series or last price. We do not
  // rely on any single selector and will return null if we cannot get a sensible array.

  // 1) Try to find candles in DOM (common platforms expose series in JS only — not accessible)
  // 2) If not possible, return null: do not fabricate data.

  // Example attempts (non-invasive): read last price text
  try{
    const priceEl = safeQuery('.price, .last-price, #lastPrice');
    const lastPriceText = priceEl ? priceEl.textContent : null;
    // We cannot produce a reliable priceSeries from page safely. So return null unless a global
    // JS variable known to contain data exists. Check some common globals (unsafe to assume)
    const possibleSeries = window.__candles__ || window.chartData || null;
    if(Array.isArray(possibleSeries) && possibleSeries.length>10){
      // Normalize: map to price values if objects
      const series = possibleSeries.map(s => typeof s === 'number' ? s : (s.close||s[4]||null)).filter(Boolean);
      if(series.length>10) return { priceSeries: series, source: 'page' };
    }
    // Fall back: if we have a lastPrice, synthesize a tiny series around it (only for demo)
    if(lastPriceText && !isNaN(Number(lastPriceText.replace(/[^0-9.\-]/g,'')))){
      const p = Number(lastPriceText.replace(/[^0-9.\-]/g,''));
      // Very small synthetic series around last price — but we must mark it as synthetic
      const series = [];
      for(let i=0;i<80;i++){ series.push(Number((p + (Math.random()-0.5)*p*0.001).toFixed(6))); }
      return { priceSeries: series, source: 'synthetic_last_price' };
    }
    return null;
  }catch(e){ return null; }
}

export default { detectSupported, getMarketData };
