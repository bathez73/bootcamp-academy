import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { normalizeWhatsAppNumber, sanitizeUTMParameters } from '@/lib/masterclass-registration';

export const dynamic = 'force-dynamic';

async function getCount() {
  const service = await getServiceRoleClient();
  if (!service) return null;

  const { count, error } = await service
    .from('masterclass_registrations')
    .select('id', { count: 'exact', head: true });

  if (error) return null;
  return count ?? 0;
}

export async function GET() {
  const count = await getCount();
  if (count === null) return NextResponse.json({ error: 'Inscriptions indisponibles' }, { status: 503 });
  return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: 'Origine de requête invalide' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Origine de requête invalide' }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 10000) return NextResponse.json({ error: 'Formulaire trop volumineux' }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
  }

  const form = body as Record<string, unknown>;
  if (typeof form.website === 'string' && form.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const fullName = typeof form.fullName === 'string' ? form.fullName.trim().replace(/\s+/g, ' ') : '';
  const email = typeof form.email === 'string' ? form.email.trim().toLowerCase() : '';
  const whatsapp = typeof form.whatsapp === 'string' ? normalizeWhatsAppNumber(form.whatsapp) : null;
  const consent = form.consent === true;
  const eventConsent = consent && form.eventConsent !== false;
  const marketingConsent = form.marketingConsent === true;
  const utm = sanitizeUTMParameters(form);

  if (fullName.length < 2 || fullName.length > 100 || /[\u0000-\u001f<>]/.test(fullName)) {
    return NextResponse.json({ error: 'Indique ton nom complet.' }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Indique une adresse email valide.' }, { status: 400 });
  }
  if (!whatsapp) return NextResponse.json({ error: 'Indique un numéro WhatsApp valide.' }, { status: 400 });
  if (!consent) return NextResponse.json({ error: 'Confirme ton accord pour recevoir les informations de la masterclass.' }, { status: 400 });

  const service = await getServiceRoleClient();
  if (!service) return NextResponse.json({ error: 'Les inscriptions sont momentanément indisponibles.' }, { status: 503 });

  const { error } = await service.from('masterclass_registrations').insert({
    full_name: fullName,
    email,
    whatsapp,
    consent,
    event_consent: eventConsent,
    marketing_consent: marketingConsent,
    ...utm,
  });

  if (error?.code === '23505') {
    const count = await getCount();
    return NextResponse.json({ ok: true, alreadyRegistered: true, count: count ?? 0 });
  }
  if (error) {
    console.error('Masterclass registration failed:', error.message);
    return NextResponse.json({ error: 'La réservation n’a pas pu être enregistrée. Réessaie dans un instant.' }, { status: 503 });
  }

  const count = await getCount();
  return NextResponse.json({ ok: true, alreadyRegistered: false, count: count ?? 0 }, { status: 201 });
}