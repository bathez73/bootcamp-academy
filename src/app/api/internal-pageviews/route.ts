import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { MEASURED_PATHS } from '@/lib/internal-pageviews';

export async function POST(request: NextRequest) {
  const reply = (status: number) => new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } });
  // No cookies, IP, user-agent, referrer, campaign or account data is persisted.
  const origin = request.headers.get('origin');
  try {
    if (!origin || new URL(origin).host !== request.headers.get('host')) return reply(403);
  } catch { return reply(403); }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply(415);
  if (Number(request.headers.get('content-length') || 0) > 512) return reply(413);
  let body;
  try {
    // Bound actual bytes too, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    let raw = '';
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512) { await reader.cancel(); return reply(413); }
      raw += decoder.decode(value, { stream: true });
    }
    body = JSON.parse(raw + decoder.decode());
  } catch { return reply(400); }
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
    Object.keys(body).some(key => !['path', 'eventId', 'occurredAt'].includes(key)) ||
    !MEASURED_PATHS.includes(body.path) || typeof body.eventId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.eventId) ||
    typeof body.occurredAt !== 'string') return reply(400);
  const occurredAt = Date.parse(body.occurredAt);
  if (!Number.isFinite(occurredAt) || occurredAt > Date.now() + 300000 || occurredAt < Date.now() - 86400000) return reply(400);
  const service = await getServiceRoleClient();
  if (!service) return reply(503);
  const { error } = await service.rpc('record_internal_pageview', {
    view_id: body.eventId, view_path: body.path, view_at: new Date(occurredAt).toISOString(),
  });
  return reply(error ? 503 : 204);
}
