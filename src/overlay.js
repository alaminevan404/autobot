// src/overlay.js
// Creates and manages the floating overlay element. Keeps broker page untouched and
// mounts the UI module inside the overlay.

import UI from './ui.js';

const CONTAINER_ID = 'evu-ai-bot-overlay';

function createContainer(){
  // Avoid duplicates
  const existing = document.getElementById(CONTAINER_ID);
  if(existing) return existing;

  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  container.style.position = 'fixed';
  container.style.right = '16px';
  container.style.top = '16px';
  container.style.zIndex = 2147483647; // very high but finite
  container.style.width = '420px';
  container.style.maxWidth = '95vw';
  container.style.height = '560px';
  container.style.maxHeight = '90vh';
  container.style.boxShadow = '0 10px 40px rgba(2,6,23,0.7)';
  container.style.borderRadius = '12px';
  container.style.background = 'linear-gradient(180deg, rgba(6,10,20,0.95), rgba(4,8,16,0.9))';
  container.style.backdropFilter = 'blur(6px)';
  container.style.overflow = 'hidden';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.resize = 'both';
  container.style.minWidth = '320px';
  container.style.minHeight = '280px';
  container.style.border = '1px solid rgba(255,255,255,0.04)';

  // Add attribute to identify for removal
  container.setAttribute('data-evu-overlay','true');

  document.body.appendChild(container);
  return container;
}

function makeDraggable(el, handleSelector){
  const handle = el.querySelector(handleSelector) || el;
  handle.style.cursor = 'move';
  let isDown = false;
  let startX, startY, startLeft, startTop;
  handle.addEventListener('pointerdown', (ev)=>{
    isDown = true; handle.setPointerCapture(ev.pointerId);
    startX = ev.clientX; startY = ev.clientY;
    startLeft = parseFloat(el.style.left || el.getBoundingClientRect().left + '');
    startTop = parseFloat(el.style.top || el.getBoundingClientRect().top + '');
    ev.preventDefault();
  });
  window.addEventListener('pointermove', (ev)=>{
    if(!isDown) return;
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    // Use px positions; clamp to viewport
    let newLeft = (startLeft + dx);
    let newTop = (startTop + dy);
    // Keep in viewport
    const vw = window.innerWidth, vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    newLeft = Math.min(Math.max(newLeft, 8 - rect.left), vw - rect.width - 8);
    newTop = Math.min(Math.max(newTop, 8 - rect.top), vh - rect.height - 8);
    el.style.right = 'unset';
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });
  window.addEventListener('pointerup', (ev)=>{ isDown = false; });
}

async function init(){
  const container = createContainer();

  // Header area with controls will be rendered by UI
  await UI.mount(container);

  // Make draggable using header
  makeDraggable(container, '[data-evu-header]');
}

function destroy(){
  const existing = document.getElementById(CONTAINER_ID);
  if(existing){ existing.remove(); window.__EVU_BOOKMARKLET_LOADED = false; }
}

export default { init, destroy };
