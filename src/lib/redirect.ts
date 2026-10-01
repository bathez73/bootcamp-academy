export function safeRedirect(value: string): string {
 if (!value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) return '/dashboard';
 try { const url = new URL(value, 'https://campus.invalid'); return url.origin === 'https://campus.invalid' ? url.pathname + url.search + url.hash : '/dashboard'; } catch { return '/dashboard'; }
}
