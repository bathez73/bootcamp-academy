import { test, expect } from '@playwright/test';

test('internal views count without consent; no contact data, cookies or duplicates; retry reuses ID', async ({ page, context }) => {
  const views = [], external = [];
  let retry = true;
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.hostname !== '127.0.0.1') { external.push(url.hostname); return route.abort(); }
    if (url.pathname === '/api/internal-pageviews') {
      views.push({ body: request.postDataJSON(), headers: await request.allHeaders() });
      if (retry) { retry = false; return route.fulfill({ status: 503 }); }
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === '/api/masterclass-registrations') return route.fulfill({ json: { count: 0 } });
    return route.continue();
  });
  await context.addCookies([{ name: 'fixture_private', value: 'must-not-send', url: 'http://127.0.0.1:3111' }]);
  await page.goto('/masterclass?email=private@example.test&utm_source=meta', { waitUntil: 'networkidle' });
  await expect.poll(() => views.length).toBe(2);
  expect(views[0].body).toEqual(views[1].body);
  expect(Object.keys(views[0].body).sort()).toEqual(['eventId', 'occurredAt', 'path']);
  expect(views[0].body.path).toBe('/masterclass');
  expect(views[0].headers.cookie).toBeUndefined();
  expect(views[0].headers.referer).toBeUndefined();
  expect(external).toHaveLength(0);
  await page.getByRole('button', { name: 'Tout refuser', exact: true }).first().click();
  await page.locator('.masterclass-header a[href="/"]').first().click();
  await expect.poll(() => views.length).toBe(3);
  await expect(page).toHaveURL('http://127.0.0.1:3111/');
  await page.waitForLoadState('networkidle');
  await page.goBack({ waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/masterclass/);
  await expect.poll(() => views.length).toBe(4);
  await page.locator('.masterclass-header-cta').click();
  await expect(page).toHaveURL(/#inscription$/);
  await page.waitForLoadState('networkidle');
  expect(views).toHaveLength(4);
  await page.reload({ waitUntil: 'networkidle' });
  await expect.poll(() => views.length).toBe(5);
  expect(new Set(views.map(view => view.body.eventId)).size).toBe(4);
  expect(external).toHaveLength(0);
});

test('internal endpoint rejects cross-site and malformed views before database access', async ({ request }) => {
  const url = 'http://127.0.0.1:3111/api/internal-pageviews';
  expect((await request.post(url, { headers: { Origin: 'https://elsewhere.invalid' }, data: {} })).status()).toBe(403);
  for (const body of [{ path: '/admin' }, { path: '/masterclass', eventId: 'invalid' }, { email: 'private@example.test' }]) {
    expect((await request.post(url, { headers: { Origin: 'http://127.0.0.1:3111' }, data: body })).status()).toBe(400);
  }
  expect((await request.post(url, { headers: { Origin: 'http://127.0.0.1:3111' }, data: { path: 'x'.repeat(600) } })).status()).toBe(413);
});
