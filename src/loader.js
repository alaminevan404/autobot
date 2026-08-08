// src/loader.js
// Entry point for the bookmarklet-hosted bundle. This script is intended to be loaded
// directly into the broker page by a bookmarklet. It creates a safe overlay panel and
// initializes the overlay UI and modules.

import Overlay from './overlay.js';

// Prevent duplicate loads
if(window.__EVU_BOOKMARKLET_LOADED){
  console.warn('EVU AI BOT already loaded');
} else {
  window.__EVU_BOOKMARKLET_LOADED = true;
  // Small guard to avoid running in unsupported frames
  try{
    // Initialize overlay asynchronously
    Overlay.init().catch(err=>{
      console.error('EVU Overlay init error', err);
    });
  }catch(e){
    console.error('Failed to start EVU loader', e);
  }
}
