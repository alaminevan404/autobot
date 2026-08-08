// src/storage.js
// Lightweight localStorage wrapper for overlay state

const KEY = 'evu_bookmarklet_state';
export const defaultBalance = 10000;
let state = null;

export async function init(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ state = JSON.parse(raw); }
    if(!state){ state = { demoBalance: defaultBalance, tradeHistory: [] }; saveState(state); }
  }catch(e){ state = { demoBalance: defaultBalance, tradeHistory: [] }; }
}

export function getState(){ if(!state) init(); return state; }
export function saveState(s){ state = s; try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){ console.warn('storage save failed', e); } }

export default { init, getState, saveState, defaultBalance };
