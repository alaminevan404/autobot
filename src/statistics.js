// src/statistics.js
// Compute simple stats from trade history
export function computeStats(history=[]){ const s = { total:0,wins:0,losses:0,winRate:0,totalPL:0,streak:0 }; if(!history||history.length===0) return s; s.total = history.length; let streakSign=null; let streakCount=0; for(const t of history){ const pl = Number(t.pl||0); s.totalPL += pl; if(pl>0){ s.wins++; if(streakSign==='win') streakCount++; else {streakSign='win';streakCount=1;} } else if(pl<0){ s.losses++; if(streakSign==='loss') streakCount++; else {streakSign='loss';streakCount=1;} } } s.winRate = s.total>0? s.wins/s.total:0; s.streak = streakCount; s.totalPL = Number(s.totalPL.toFixed(2)); return s; }

export default { computeStats };
