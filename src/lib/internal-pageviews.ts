// Per-view identity only: kept in memory, never a visitor/session identifier.
export const MEASURED_PATHS = ['/', '/masterclass', '/academy', '/bootcamp', '/inscription', '/programme'];
let currentPath = '';
export function observeInternalPageView(pathname: string, restored = false) {
  if (typeof window === 'undefined' || (!restored && pathname === currentPath)) return;
  currentPath = pathname;
  if (!MEASURED_PATHS.includes(pathname)) return;
  const body = JSON.stringify({ path: pathname, eventId: crypto.randomUUID(), occurredAt: new Date().toISOString() });
  const send = () => fetch('/api/internal-pageviews', {
    method: 'POST', body, headers: { 'Content-Type': 'application/json' },
    credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true,
  });
  // Retry the SAME event once, including when a committed response was lost.
  void send().then(response => {
    if (response.status >= 500) return send();
  }).catch(() => send()).catch(() => { /* Measurement never blocks the page. */ });
}
