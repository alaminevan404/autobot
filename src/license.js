// src/license.js
// License module for overlay. Does not contain secrets. Uses a backend endpoint for validation.

const STORAGE_KEY = 'evu_eu_license';
const VALIDATE_ENDPOINT = '/api/validate-license'; // Cloudflare Worker endpoint (placeholder)

export async function validateLicense(key){
  if(!key) return { active:false, message:'Missing key' };
  // Attempt backend validation
  try{
    const r = await fetch(VALIDATE_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({key}) });
    if(r.ok){
      const data = await r.json();
      if(data && data.valid){ return { active:true, message:data.message||'Valid', expires:data.expires||null }; }
      return { active:false, message:data.message||'Invalid' };
    }
  }catch(e){
    // Network or endpoint absent: fallback demo rule (frontend-only)
    console.warn('License validation endpoint failed, using demo fallback', e);
  }
  // Demo acceptance: key containing 'DEMO' is accepted for local demo only
  if(key.toUpperCase().includes('DEMO')) return { active:true, message:'Demo license (frontend-only)', expires:null };
  return { active:false, message:'Invalid or expired' };
}

export async function activateLicense(key){
  const res = await validateLicense(key);
  if(res.active){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({ key, active:true, activatedAt: new Date().toISOString(), expires: res.expires||null })); }catch(e){console.warn(e)}
  }
  return res;
}

export async function getLicenseState(){
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(!raw) return null; return JSON.parse(raw); }catch(e){return null}
}

export default { validateLicense, activateLicense, getLicenseState };
