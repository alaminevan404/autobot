// src/market-engine.js
// Market analysis helpers & simple demo price series generator

export function simplePriceSeries(seed='EURUSD', length=120){
  const out=[]; let base=1 + (seed.split('').reduce((s,c)=>s+c.charCodeAt(0),0)%100)/1000; for(let i=0;i<length;i++){ const noise=(Math.random()-0.5)*(base*0.0015); base = Math.max(0.0001, base + Math.sin(i/10)*(base*0.0008) + noise); out.push(Number(base.toFixed(6))); } return out;
}

export function analyzeVolatility(series=[]){ if(!series||series.length<2) return {stddev:0,avgRange:0}; const diffs=[]; for(let i=1;i<series.length;i++) diffs.push(Math.abs(series[i]-series[i-1])); const avg = diffs.reduce((s,v)=>s+v,0)/diffs.length; const mean = avg; const sd = Math.sqrt(diffs.reduce((s,v)=>s+Math.pow(v-mean,2),0)/diffs.length); return { stddev:sd, avgRange:avg } }

export function detectMarketCondition(series=[]){ if(!series||series.length<12) return 'LOW_QUALITY'; const vol = analyzeVolatility(series).stddev; const first=series[0], last=series[series.length-1]; const slope = (last-first)/series.length; if(vol > Math.abs(first)*0.002) return 'HIGH_VOLATILITY'; if(Math.abs(slope) > vol*1.2) return 'TRENDING'; return 'RANGING'; }

export default { simplePriceSeries, analyzeVolatility, detectMarketCondition };
