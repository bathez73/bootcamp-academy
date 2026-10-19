import { test, expect } from '@playwright/test';
const storageKey='bootcamp_academy_cookie_consent';
const eventId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let network;
test.beforeEach(async ({context})=>{
  network=[];
  // Intercept all third-party requests. Never send synthetic events to Meta.
  await context.route('**/*', async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='connect.facebook.net'){
      network.push({kind:'sdk'});
      return route.fulfill({contentType:'application/javascript',body:`
        window.__metaCalls=[];
        const q=window.fbq;
        const run=(...args)=>{
          window.__metaCalls.push(args);
          if(args[0]==='trackSingle'){
            const image=new Image();
            image.src='https://www.facebook.com/tr/?id='+args[1]+'&ev='+args[2]+'&eid='+args[4].eventID;
          }
        };
        q.callMethod=run;
        q.queue.splice(0).forEach(args=>run(...args));
        document.cookie='_fbp=fixture; Path=/';
      `});
    }
    if(url.hostname.endsWith('facebook.com')){
      network.push({kind:'event',event:url.searchParams.get('ev'),id:url.searchParams.get('eid')});
      return route.fulfill({status:200,contentType:'image/gif',body:Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7','base64')});
    }
    if(url.hostname==='127.0.0.1'){
      if(url.pathname==='/api/masterclass-registrations') return route.fulfill({json:{count:0}});
      return route.continue();
    }
    return route.abort();
  });
});
const events = name => network.filter(item=>item.event===name);
async function visit(page,path='/masterclass'){await page.goto(path,{waitUntil:'networkidle'});}
async function accept(page){await page.getByRole('button',{name:'Tout accepter',exact:true}).first().click();await expect.poll(()=>events('PageView').length).toBe(1);}
async function preferences(page){await page.getByRole('button',{name:'Gérer mes cookies',exact:true}).last().click();await expect(page.getByRole('dialog')).toBeVisible();}
async function fillRegistration(page){
  await page.locator('#masterclass-name').fill('Fixture Test');
  await page.locator('#masterclass-email').fill('fixture@example.test');
  await page.locator('#masterclass-whatsapp').fill('0190000000');
  await page.locator('input[name="consent"]').check();
}
async function submit(page){await page.locator('.masterclass-registration-form button[type="submit"]').click();}
async function mockResult(page,result,status=201){
  await page.route('**/api/masterclass-registrations',route=>route.fulfill({status,json:result}));
}
test('first visit: three accessible choices, no tracker or optional storage, no overlay',async({page},info)=>{
  await visit(page,'/masterclass?utm_source=meta');
  const banner=page.getByRole('complementary',{name:'Vos choix de confidentialité'});
  await expect(banner).toBeVisible();
  for(const name of ['Tout accepter','Tout refuser','Personnaliser']){
    const button=banner.getByRole('button',{name,exact:true});
    await expect(button).toBeVisible();
    expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await banner.evaluate(el=>getComputedStyle(el).position)).not.toBe('fixed');
  expect(await page.evaluate(()=>sessionStorage.getItem('masterclass_utm'))).toBeNull();
  expect(network.length).toBe(0);
  await page.screenshot({path:'test-results/consent-'+info.project.name+'.png',fullPage:false});
});
test('acceptance: one init and PageView; refresh is a new genuine view',async({page})=>{
  await visit(page);await accept(page);
  expect(network.filter(item=>item.kind==='sdk')).toHaveLength(1);
  const calls=await page.evaluate(()=>window.__metaCalls);
  expect(calls.filter(args=>args[0]==='init')).toHaveLength(1);
  expect(calls.find(args=>args[0]==='init')[1]).toBe('879987208126752');
  expect(calls.some(args=>args[0]==='set'&&args[1]==='autoConfig'&&args[2]===false)).toBe(true);
  await page.reload({waitUntil:'networkidle'});
  await expect.poll(()=>events('PageView').length).toBe(2);
  expect(new Set(events('PageView').map(item=>item.id)).size).toBe(2);
});
test('refusal survives refresh and does not load marketing',async({page})=>{
  await visit(page);await page.getByRole('button',{name:'Tout refuser',exact:true}).first().click();
  await page.reload({waitUntil:'networkidle'});
  expect(network.length).toBe(0);
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).marketing,storageKey)).toBe(false);
});
test('customization defaults off; accepting again does not duplicate a page view',async({page})=>{
  await visit(page);await page.getByRole('button',{name:'Personnaliser',exact:true}).click();
  const dialog=page.getByRole('dialog');
  const checkbox=dialog.getByRole('checkbox',{name:/Mesure publicitaire Meta/});
  await expect(checkbox).not.toBeChecked();await checkbox.check();
  await dialog.getByRole('button',{name:'Enregistrer mes choix',exact:true}).click();
  await expect.poll(()=>events('PageView').length).toBe(1);
  await preferences(page);await dialog.getByRole('button',{name:'Tout accepter',exact:true}).click();
  await page.waitForTimeout(200);expect(events('PageView')).toHaveLength(1);
});
test('withdrawal removes Meta cookies and prevents events after reload',async({page,context})=>{
  await visit(page);await accept(page);await preferences(page);
  await page.getByRole('dialog').getByRole('button',{name:'Tout refuser',exact:true}).click();
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).marketing,storageKey)).toBe(false);
  expect((await context.cookies()).filter(cookie=>['_fbp','_fbc'].includes(cookie.name))).toHaveLength(0);
  expect(events('PageView')).toHaveLength(1);
  await page.reload({waitUntil:'networkidle'});expect(events('PageView')).toHaveLength(1);
});
test('internal navigation and back count each view once; anchors count none',async({page})=>{
  await visit(page,'/masterclass?utm_source=meta&fbclid=fixture-click');await accept(page);
  await page.locator('.masterclass-header a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(()=>events('PageView').length).toBe(2);
  await page.goBack({waitUntil:'networkidle'});
  await expect(page).toHaveURL(/\/masterclass/);
  await expect.poll(()=>events('PageView').length).toBe(3);
  await page.locator('.masterclass-header-cta').click();
  await expect(page).toHaveURL(/#inscription$/);
  await page.waitForTimeout(200);
  expect(events('PageView')).toHaveLength(3);
});
test('confirmed new registration sends one Lead; duplicates send none',async({page})=>{
  await mockResult(page,{ok:true,recorded:true,alreadyRegistered:false,eventId});
  await visit(page);await accept(page);await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  await expect.poll(()=>events('Lead').length).toBe(1);
  expect(events('Lead')[0].id).toBe(eventId);
  await page.getByRole('button',{name:'Inscrire une autre personne'}).click();
  await mockResult(page,{ok:true,recorded:true,alreadyRegistered:true});
  await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(events('Lead')).toHaveLength(1);expect(events('Purchase')).toHaveLength(0);
});
test('failed registration and honeypot acknowledgments never create a Lead',async({page})=>{
  await mockResult(page,{error:'Fixture failure'},503);
  await visit(page);await accept(page);await fillRegistration(page);await submit(page);
  await expect(page.locator('.masterclass-form-error[role="alert"]')).toContainText('Fixture failure');
  expect(events('Lead')).toHaveLength(0);
  await mockResult(page,{ok:true,recorded:false},200);
  await submit(page);await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(events('Lead')).toHaveLength(0);
});
test('registration succeeds without advertising permission; later acceptance never replays a Lead',async({page})=>{
  let submitted;
  await page.route('**/api/masterclass-registrations',async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:201,json:{ok:true,recorded:true,alreadyRegistered:false,eventId}});});
  await visit(page,'/masterclass?utm_source=meta');await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(submitted.advertisingConsent).toBe(false);expect(submitted.utm_source).toBeUndefined();
  expect(network).toHaveLength(0);
  await page.getByRole('button',{name:'Tout accepter',exact:true}).first().click();
  await expect.poll(()=>events('PageView').length).toBe(1);expect(events('Lead')).toHaveLength(0);
});
test('Academy is covered; commercial intent never sends Purchase',async({page})=>{
  await visit(page,'/masterclass');await accept(page);
  await page.dispatchEvent('body','bootcamp:conversion',{detail:{event:'full_payment_click'}});
  expect(events('Purchase')).toHaveLength(0);
  await page.goto('/academy',{waitUntil:'networkidle'});
  await expect.poll(()=>events('PageView').length).toBe(2);expect(events('Purchase')).toHaveLength(0);
});
test('unversioned historical acceptance is renewed, never silently trusted',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(key,'accepted'),storageKey);
  await visit(page);
  await expect(page.getByRole('button',{name:'Tout accepter',exact:true}).first()).toBeVisible();
  expect(network).toHaveLength(0);
});
test('refusal remains effective if localStorage becomes read-only after acceptance',async({page})=>{
  await visit(page);await accept(page);
  await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new Error('Read-only fixture');};});
  await preferences(page);
  await page.getByRole('dialog').getByRole('button',{name:'Tout refuser',exact:true}).click();
  await page.waitForLoadState('networkidle');
  await page.reload({waitUntil:'networkidle'});
  expect(events('PageView')).toHaveLength(1);
  expect(await page.evaluate(()=>document.cookie.includes('bootcamp_marketing_denied=1'))).toBe(true);
});
test('cross-tab withdrawal stops the previously authorized tab',async({page,context})=>{
  await visit(page);await accept(page);
  const second=await context.newPage();
  await visit(second);
  await expect.poll(()=>events('PageView').length).toBe(2);
  await preferences(second);
  await second.getByRole('dialog').getByRole('button',{name:'Tout refuser',exact:true}).click();
  await second.waitForLoadState('networkidle');
  await page.waitForLoadState('networkidle');
  await page.reload({waitUntil:'networkidle'});
  expect(events('PageView')).toHaveLength(2);
});
test('contact query parameters suppress Meta even with previous acceptance',async({page})=>{
  await visit(page);await accept(page);
  await page.goto('/masterclass?email=private@example.test',{waitUntil:'networkidle'});
  expect(events('PageView')).toHaveLength(1);
});
