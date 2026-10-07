export const MARKETING_CONFIG = {
  SHOW_TESTIMONIALS: true,
  PLACES_RESTANTES: 10,
  META_PIXEL_ID: '879987208126752',
  WHATSAPP_GROUP_URL: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/FMoQAjUu9nk6z5X40nadbq',
  EVENT_DATETIME: '2026-10-24T19:00:00Z',
  OPEN_GRAPH_IMAGE: process.env.NEXT_PUBLIC_OG_IMAGE || null,
} as const;

export type CookieConsentChoice = 'accepted' | 'refused';
export const COOKIE_CONSENT_STORAGE_KEY = 'bootcamp_academy_cookie_consent';
