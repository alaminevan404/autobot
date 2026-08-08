// workers-site/index.js
// Minimal fallback worker entry so Wrangler/Pages does not fail when it expects
// a worker entry point. This worker returns a simple response for any request.
// Note: For a pure static site you may not need a worker; this file exists to
// satisfy Pages/Wrangler deployment checks. It does not modify your existing
// static bundle at public/bundle.js.

export default {
  async fetch(request, env, ctx) {
    return new Response('EVU AI BOT (static site)', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
