// src/ui.js
// Builds the floating UI inside the overlay container. Provides license screen, controls,
// signal display, trade history, and settings. This code is intentionally minimal and
// avoids any direct broker page manipulation.

import License from './license.js';
import SignalEngine from './signal-engine.js';
import PaperTrading from './paper-trading.js';
import Storage from './storage.js';
import Adapters from './adapters/pocket-option-adapter.js';

const TEMPLATE = `
  <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.03);" data-evu-header>
    <div style="display:flex;gap:10px;align-items:center">
      <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#4f9cff,#8b5cf6);display:flex;align-items:center;justify-content:center;font-weight:700;color:white">EVU</div>
      <div>
        <div style="font-weight:700">EVU AI BOT (Demo Overlay)</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.65)">Simulated signals only — no real orders</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <button id="evu-collapse" title="Collapse" style="background:transparent;border:0;color:rgba(255,255,255,0.75);cursor:pointer">_</button>
      <button id="evu-close" title="Close" style="background:transparent;border:0;color:rgba(255,255,255,0.9);cursor:pointer">✕</button>
    </div>
  </div>
  <div id="evu-body" style="padding:12px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:10px">
    <div id="evu-license-area"></div>
    <div id="evu-main-area" style="display:none;flex-direction:column;gap:10px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1">
          <label class="muted" style="font-size:12px">Asset</label>
          <select id="evu-asset" style="width:100%;padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)">
            <option>EUR/USD</option>
            <option>USD/JPY</option>
            <option>BTC/USD</option>
          </select>
        </div>
        <div style="width:100px">
          <label class="muted" style="font-size:12px">Timeframe</label>
          <select id="evu-timeframe" style="width:100%;padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)">
            <option value="M1">1m</option>
            <option value="M5" selected>5m</option>
            <option value="M15">15m</option>
          </select>
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <div style="flex:1">
          <label class="muted">Demo trade amount</label>
          <input id="evu-amount" type="number" value="10" style="width:100%;padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)" />
        </div>
        <div style="width:110px">
          <label class="muted">Profit target</label>
          <input id="evu-target" type="number" value="100" style="width:100%;padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)" />
        </div>
        <div style="width:120px">
          <label class="muted">Max demo loss</label>
          <input id="evu-maxloss" type="number" value="500" style="width:100%;padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)" />
        </div>
      </div>

      <div style="display:flex;gap:8px;align-items:center">
        <button id="evu-start" style="padding:8px 12px;border-radius:8px;background:linear-gradient(90deg,#0b2a44,#07324e);border:0;color:white;cursor:pointer">Start</button>
        <button id="evu-stop" style="padding:8px 12px;border-radius:8px;background:linear-gradient(90deg,#3a1b1f,#26131b);border:0;color:white;cursor:pointer">Stop</button>
        <button id="evu-reset" style="padding:8px 12px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04);color:white;cursor:pointer">Reset</button>
        <div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end">
          <div style="font-size:12px;color:rgba(255,255,255,0.65)">Bot status</div>
          <div id="evu-bot-status">Stopped</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-direction:column">
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1">
            <div style="font-size:12px;color:rgba(255,255,255,0.7)">Signal</div>
            <div id="evu-signal" style="font-weight:800;font-size:18px">WAIT</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.65)">Confidence: <span id="evu-confidence">—</span></div>
          </div>
          <div style="width:140px">
            <div style="font-size:12px;color:rgba(255,255,255,0.7)">Market condition</div>
            <div id="evu-market" style="font-weight:700">—</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.65)">Reason: <span id="evu-reason">—</span></div>
          </div>
        </div>

        <div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7)">Demo balance</div>
          <div id="evu-balance" style="font-weight:800">$10,000.00</div>
        </div>

        <div>
          <div style="font-size:13px;color:rgba(255,255,255,0.8);">Trade History</div>
          <div id="evu-history" style="max-height:160px;overflow:auto;margin-top:6px;border:1px solid rgba(255,255,255,0.03);padding:6px;border-radius:8px;background:rgba(255,255,255,0.01)"></div>
        </div>

      </div>
    </div>
  </div>
`;

async function mount(container){
  container.innerHTML = TEMPLATE;

  // Wire close/collapse
  container.querySelector('#evu-close').addEventListener('click', ()=>{
    // cleanup
    container.remove(); window.__EVU_BOOKMARKLET_LOADED = false;
  });
  const collapseBtn = container.querySelector('#evu-collapse');
  const body = container.querySelector('#evu-body');
  collapseBtn.addEventListener('click', ()=>{
    if(body.style.display === 'none'){ body.style.display = ''; collapseBtn.textContent = '_'; }
    else { body.style.display = 'none'; collapseBtn.textContent = '▢'; }
  });

  // License area
  const licenseArea = container.querySelector('#evu-license-area');
  const mainArea = container.querySelector('#evu-main-area');

  // Show license UI
  const licState = await License.getLicenseState();
  if(!licState || !licState.active){
    // Render activation fields
    licenseArea.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <input id="evu-license-key" placeholder="License key (DEMO-XXXX)" style="padding:8px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.04)" />
        <div style="display:flex;gap:8px">
          <button id="evu-activate" style="padding:8px;border-radius:8px;background:linear-gradient(90deg,#4f9cff,#8b5cf6);border:0;color:black;cursor:pointer">Activate</button>
          <div id="evu-license-msg" style="color:rgba(255,255,255,0.7);align-self:center">Status: inactive</div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6)">Note: For production, implement license validation on a backend API (Cloudflare Workers).</div>
      </div>
    `;
    licenseArea.querySelector('#evu-activate').addEventListener('click', async ()=>{
      const key = licenseArea.querySelector('#evu-license-key').value.trim();
      const msg = licenseArea.querySelector('#evu-license-msg');
      msg.textContent = 'Validating…';
      try{
        const res = await License.activateLicense(key);
        if(res.active){
          msg.textContent = 'Active (demo)';
          licenseArea.innerHTML = '';
          mainArea.style.display = 'flex';
          await Storage.init();
          bindMainUI(container);
        }else{
          msg.textContent = res.message || 'Invalid';
        }
      }catch(e){ msg.textContent = 'Validation failed'; console.error(e); }
    });
  } else {
    // License active -> show main area
    licenseArea.innerHTML = '';
    mainArea.style.display = 'flex';
    await Storage.init();
    bindMainUI(container);
  }
}

function formatCurrency(v){ return (v>=0?'+':'-') + '$' + Math.abs(Number(v||0)).toFixed(2); }

function renderHistory(container, history){
  const el = container.querySelector('#evu-history');
  el.innerHTML = '';
  if(!history || history.length===0) { el.textContent = 'No trades yet.'; return; }
  const list = document.createElement('div');
  for(const t of history.slice().reverse()){
    const row = document.createElement('div');
    row.style.display='flex';row.style.justifyContent='space-between';row.style.padding='6px 4px';row.style.borderBottom='1px solid rgba(255,255,255,0.02)';
    row.innerHTML = `<div style="font-size:12px">${new Date(t.time).toLocaleTimeString()} ${t.asset} ${t.timeframe} ${t.signal}</div><div style="font-weight:700">${formatCurrency(t.pl)}</div>`;
    list.appendChild(row);
  }
  el.appendChild(list);
}

function bindMainUI(container){
  const asset = container.querySelector('#evu-asset');
  const timeframe = container.querySelector('#evu-timeframe');
  const amount = container.querySelector('#evu-amount');
  const target = container.querySelector('#evu-target');
  const maxloss = container.querySelector('#evu-maxloss');
  const start = container.querySelector('#evu-start');
  const stop = container.querySelector('#evu-stop');
  const reset = container.querySelector('#evu-reset');
  const status = container.querySelector('#evu-bot-status');
  const signal = container.querySelector('#evu-signal');
  const confidence = container.querySelector('#evu-confidence');
  const market = container.querySelector('#evu-market');
  const reason = container.querySelector('#evu-reason');
  const balance = container.querySelector('#evu-balance');

  // Load storage state
  let state = Storage.getState();
  balance.textContent = '$' + (state.demoBalance || 10000).toFixed(2);
  renderHistory(container, state.tradeHistory || []);

  let running = false;
  let loop = null;

  async function tick(){
    // Attempt to get market data via adapter
    let marketData = null;
    try{ marketData = await Adapters.getMarketData(asset.value, timeframe.value); }catch(e){ marketData = null; }
    if(!marketData){
      market.textContent = 'Data unavailable';
      signal.textContent = 'WAIT'; confidence.textContent = '—'; reason.textContent = 'Market data unavailable';
      return;
    }
    // compute signal
    const result = await SignalEngine.computeSignal({ asset: asset.value, timeframe: timeframe.value, priceSeries: marketData.priceSeries });
    signal.textContent = result.signal;
    confidence.textContent = `${Math.round((result.confidence||0)*100)}%`;
    market.textContent = result.marketCondition || '—';
    reason.textContent = result.reason || result.details?.marketCondition || '—';

    // If signal is CALL/PUT, open simulated trade
    if((result.signal==='CALL' || result.signal==='PUT')){
      const trade = await PaperTrading.openSimulatedTrade({
        signal: result.signal,
        asset: asset.value,
        timeframe: timeframe.value,
        amount: Number(amount.value)||10,
        confidence: result.confidence
      });
      // Update UI and storage
      state.tradeHistory.push(trade);
      state.demoBalance = Number(state.demoBalance) + Number(trade.pl);
      Storage.saveState(state);
      balance.textContent = '$' + (state.demoBalance||0).toFixed(2);
      renderHistory(container, state.tradeHistory || []);

      // check stops
      if((state.demoBalance - (Storage.defaultBalance||10000)) <= -Math.abs(Number(maxloss.value)||500)){
        stopBot('Maximum demo loss reached');
      }
      if((Storage.defaultBalance - state.demoBalance) >= Number(target.value||100)){
        stopBot('Profit target reached');
      }
    }
  }

  function startBot(){
    if(running) return; running = true; status.textContent = 'Running';
    loop = setInterval(tick, 5000); tick();
  }
  function stopBot(reasonText){
    if(!running) return; running = false; status.textContent = 'Stopped';
    if(loop) clearInterval(loop); loop = null;
    if(reasonText) alert(`Bot stopped: ${reasonText}`);
  }
  function resetBot(){
    if(!confirm('Reset demo data?')) return;
    state = { demoBalance: Storage.defaultBalance, tradeHistory: [] };
    Storage.saveState(state);
    balance.textContent = '$' + (state.demoBalance||0).toFixed(2);
    renderHistory(container, []);
  }

  start.addEventListener('click', ()=> startBot());
  stop.addEventListener('click', ()=> stopBot('Stopped by user'));
  reset.addEventListener('click', ()=> resetBot());
}

export default { mount };
