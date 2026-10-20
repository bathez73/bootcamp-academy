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
async function visit(page,path='/programme'){await page.goto(path,{waitUntil:'networkidle'});}
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
test('Academy is covered; commercial intent never sends Purchase',async({page})=>{
  await visit(page,'/programme');await accept(page);
  await page.dispatchEvent('body','bootcamp:conversion',{detail:{event:'full_payment_click'}});
  expect(events('Purchase')).toHaveLength(0);
  await page.goto('/academy',{waitUntil:'networkidle'});
  await expect.poll(()=>events('PageView').length).toBe(2);expect(events('Purchase')).toHaveLength(0);
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


test('masterclass automatically sends one PageView without cookie UI; refresh sends a new view',async({page})=>{
  await visit(page,'/masterclass?utm_source=meta');
  await expect(page.getByRole('button',{name:'Tout accepter',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Gérer mes cookies',exact:true})).toHaveCount(0);
  await expect.poll(()=>events('PageView').length).toBe(1);
  expect(network.filter(item=>item.kind==='sdk')).toHaveLength(1);
  const calls=await page.evaluate(()=>window.__metaCalls);
  expect(calls.filter(args=>args[0]==='init')).toHaveLength(1);
  expect(calls.find(args=>args[0]==='init')[1]).toBe('879987208126752');
  expect(calls.some(args=>args[0]==='set'&&args[1]==='autoConfig'&&args[2]===false)).toBe(true);
  expect(await page.evaluate(key=>localStorage.getItem(key),storageKey)).toBeNull();
  await page.reload({waitUntil:'networkidle'});
  await expect.poll(()=>events('PageView').length).toBe(2);
  expect(new Set(events('PageView').map(item=>item.id)).size).toBe(2);
});

test('masterclass measures even with a previous formation refusal',async({page})=>{
  await visit(page);
  await page.getByRole('button',{name:'Tout refuser',exact:true}).first().click();
  expect(network).toHaveLength(0);
  await visit(page,'/masterclass');
  await expect.poll(()=>events('PageView').length).toBe(1);
});

test('new confirmed registration sends one automatic Lead and UTM without inventing consent',async({page})=>{
  let submitted;
  await page.route('**/api/masterclass-registrations',async route=>{
    submitted=route.request().postDataJSON();
    await route.fulfill({status:201,json:{ok:true,recorded:true,alreadyRegistered:false,eventId}});
  });
  await visit(page,'/masterclass?utm_source=meta');
  await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  await expect.poll(()=>events('Lead').length).toBe(1);
  expect(events('Lead')[0].id).toBe(eventId);
  expect(submitted.advertisingConsent).toBe(false);
  expect(submitted.utm_source).toBe('meta');
  await page.getByRole('button',{name:'Inscrire une autre personne'}).click();
  await mockResult(page,{ok:true,recorded:true,alreadyRegistered:false,eventId});
  await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(events('Lead')).toHaveLength(1);
  expect(network.filter(item=>item.kind==='event').every(item=>['PageView','Lead'].includes(item.event))).toBe(true);
});

test('errors, existing registrations and honeypot responses do not send Lead',async({page})=>{
  await mockResult(page,{error:'Fixture failure'},503);
  await visit(page,'/masterclass');await fillRegistration(page);await submit(page);
  await expect(page.locator('.masterclass-form-error[role="alert"]')).toContainText('Fixture failure');
  expect(events('Lead')).toHaveLength(0);
  await mockResult(page,{ok:true,recorded:true,alreadyRegistered:true});
  await submit(page);await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(events('Lead')).toHaveLength(0);
  await page.getByRole('button',{name:'Inscrire une autre personne'}).click();
  await mockResult(page,{ok:true,recorded:false},200);
  await fillRegistration(page);await submit(page);
  await expect(page.locator('#masterclass-registration-confirmation')).toBeVisible();
  expect(events('Lead')).toHaveLength(0);
});

test('anchors do not duplicate automatic PageView; private query suppresses the pixel',async({page})=>{
  await visit(page,'/masterclass?utm_source=meta');
  await expect.poll(()=>events('PageView').length).toBe(1);
  await page.locator('.masterclass-header-cta').click();
  await expect(page).toHaveURL(/#inscription$/);
  await page.waitForTimeout(200);expect(events('PageView')).toHaveLength(1);
  await visit(page,'/masterclass?email=private@example.test');
  expect(events('PageView')).toHaveLength(1);
});
