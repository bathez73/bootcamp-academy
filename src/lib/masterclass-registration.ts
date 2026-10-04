export const MASTERCLASS_PRIORITY_CAPACITY = 100;

export function normalizeWhatsAppNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (/^\d{8}$/.test(compact)) return `+229${compact}`;
  if (/^\+?[1-9]\d{7,14}$/.test(compact)) return compact.startsWith('+') ? compact : `+${compact}`;
  return null;
}

export function getPriorityPlacesRemaining(registrations: number) {
  return Math.max(0, MASTERCLASS_PRIORITY_CAPACITY - Math.max(0, registrations));
}