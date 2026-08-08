// src/signal-engine.js
// Signal engine for demo/paper trading. Exposes computeSignal({asset,timeframe,priceSeries})
// Returns { signal: 'CALL'|'PUT'|'WAIT', confidence:0..1, marketCondition, reason, details }

import Market from './market-engine.js';

function ema(series, period=8){ if(!series||series.length===0) return []; const k=2/(period+1); let prev=series[0]; const out=[prev]; for(let i=1;i<series.length;i++){ const v = series[i]*k + prev*(1-k); out.push(v); prev=v; } return out; }
function rsi(series, period=14){ if(!series||series.length<=period) return null; let gains=0, losses=0; for(let i=1;i<=period;i++){ const d = series[i]-series[i-1]; if(d>0) gains+=d; else losses+=Math.abs(d); } let avgG=gains/period, avgL=losses/period; for(let i=period+1;i<series.length;i++){ const d = series[i]-series[i-1]; avgG = (avgG*(period-1) + Math.max(0,d))/period; avgL = (avgL*(period-1) + Math.max(0,-d))/period; } if(avgL===0) return 100; const rs = avgG/avgL; return 100 - (100/(1+rs)); }

export async function computeSignal({ asset='EUR/USD', timeframe='M5', priceSeries=null, options={} }={}){
  try{
    // If priceSeries not provided, try to generate a simple demo series (but do NOT claim it's live data)
    if(!priceSeries){ priceSeries = Market.simplePriceSeries(asset.replace('/',''), 120); }
    const marketCondition = Market.detectMarketCondition(priceSeries);

    // If low quality, return WAIT
    if(marketCondition==='LOW_QUALITY'){
      return { signal:'WAIT', confidence:0.05, marketCondition, reason:'Low quality data', details:{} };
    }

    const shortEMA = ema(priceSeries.slice(-30),8).slice(-1)[0];
    const longEMA = ema(priceSeries.slice(-60),21).slice(-1)[0];
    const rsiVal = rsi(priceSeries.slice(-50),14);

    let score=0; let reason = '';
    if(shortEMA && longEMA){ score += (shortEMA>longEMA?1:-1)*1.0; reason += 'EMA'; }
    if(typeof rsiVal==='number'){ if(rsiVal>65){ score += 0.8; reason += ' RSI>;65'; } else if(rsiVal<35){ score -= 0.8; reason += ' RSI<35'; } }

    // small PA influence
    const lastDir = priceSeries[priceSeries.length-1] - priceSeries[priceSeries.length-2];
    score += Math.sign(lastDir) * 0.3;

    // adapt by condition
    if(marketCondition==='HIGH_VOLATILITY') score *= 0.6;
    if(marketCondition==='RANGING') score *= 0.8;

    const conf = Math.max(0.02, Math.min(0.95, 0.5 + (score/3)));
    let signal = 'WAIT'; if(score>0.6) signal='CALL'; else if(score<-0.6) signal='PUT';
    return { signal, confidence: conf, marketCondition, reason: reason.trim(), details:{score, rsi:rsiVal, shortEMA, longEMA} };
  }catch(err){ return { signal:'WAIT', confidence:0.02, marketCondition:'LOW_QUALITY', reason:'Engine error', details:{error:String(err)} } }
}

export default { computeSignal };
