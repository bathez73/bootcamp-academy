export const MASTERCLASS_PRIORITY_CAPACITY = 100;
export const MASTERCLASS_EVENT_UTC = '2026-10-24T19:00:00Z';
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export function normalizeWhatsAppNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (/^\d{8}$/.test(compact)) return `+229${compact}`;
  if (/^\+?[1-9]\d{7,14}$/.test(compact)) return compact.startsWith('+') ? compact : `+${compact}`;
  return null;
}

export function getPriorityPlacesRemaining(registrations: number) {
  return Math.max(0, MASTERCLASS_PRIORITY_CAPACITY - Math.max(0, registrations));
}

export function getEventUtcTimestamp() {
  return Date.parse(MASTERCLASS_EVENT_UTC);
}

export function getUTMParameters(url: URL | string = '') {
  const parsedUrl = typeof url === 'string' ? new URL(url, 'https://example.com') : url;
  const params: Record<string, string> = {};

  for (const key of UTM_KEYS) {
    const value = parsedUrl.searchParams.get(key);
    if (value) params[key] = value;
  }

  return params;
}

export function sanitizeUTMParameters(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const params: Record<string, string> = {};
  const input = value as Record<string, unknown>;
  for (const key of UTM_KEYS) {
    const candidate = input[key];
    if (typeof candidate === 'string' && candidate.trim() && candidate.length <= 255) {
      params[key] = candidate.trim();
    }
  }

  return params;
}

export function buildTrackedHref(pathOrHash: string, utmParams: Record<string, string> = {}) {
  if (!Object.keys(utmParams).length) return pathOrHash;

  const hasProtocol = /^https?:\/\//i.test(pathOrHash);
  const baseUrl = hasProtocol ? new URL(pathOrHash) : new URL(pathOrHash, 'https://example.com');
  const searchParams = new URLSearchParams(baseUrl.search);

  for (const [key, value] of Object.entries(utmParams)) {
    if (value) searchParams.set(key, value);
  }

  const nextSearch = searchParams.toString();
  if (hasProtocol) {
    baseUrl.search = nextSearch;
    return baseUrl.toString();
  }

  const relativePath = pathOrHash.startsWith('#') ? '' : baseUrl.pathname;
  const relative = relativePath + (nextSearch ? `?${nextSearch}` : '') + baseUrl.hash;
  return relative;
}