const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.SPIKE_TEST_BASE || 'http://127.0.0.1:8080/';
const output = new URL('../.test-output/', import.meta.url);
await fs.mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true, ...(process.env.SPIKE_CHROMIUM_EXECUTABLE ? {executablePath:process.env.SPIKE_CHROMIUM_EXECUTABLE} : {})});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    const failures=[];
    page.on('pageerror', error=>failures.push(error.message));
    for (const [route,count] of [['',10],['broadcast/',5],['coldwell/',7],['contact/',0]]) {
      const response=await page.goto(base+route);
      assert.equal(response.status(),200,route+' must load');
      await page.waitForLoadState('networkidle');
      if (count) { await page.waitForSelector('.work-card'); assert.equal(await page.locator('.work-card').count(),count,route+' inventory'); }
      assert.equal(await page.locator('h1').count(),1);
      const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(dimensions.scroll<=dimensions.client+1, route+' horizontal overflow at '+width);
      await page.locator('img').evaluateAll(images=>images.forEach(image=>image.loading='eager'));
      await page.waitForFunction(()=>Array.from(document.images).every(image=>image.complete),{},{timeout:20000});
      const expectedImages=await page.evaluate(async ()=>{
        const root=new URL(document.body.dataset.root,document.baseURI);
        const manifest=await (await fetch(new URL('assets/portfolio.json',root))).json();
        const collection=document.querySelector('[data-collection]')?.dataset.collection;
        const media=(manifest[collection]||[]).filter(item=>collection==='broadcast'?item.image:item.poster).length;
        return media+(manifest.logo?document.querySelectorAll('.brand').length:0);
      });
      assert.equal(await page.locator('img').count(),expectedImages,route+' rendered supplied imagery count');
      const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete || !image.naturalWidth).map(image=>image.src));
      assert.deepEqual(broken,[],route+' missing images');
      await page.screenshot({path:new URL(width+'-'+(route.replaceAll('/','')||'public')+'.png',output).pathname,fullPage:true});
    }
    if (width===390) {
      await page.goto(base);
      await page.locator('.nav-toggle').click();
      assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'true');
      await page.locator('.nav-links a[data-route=\"broadcast\"]').click();
      await page.waitForURL(base+'broadcast/');
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');
      const zoom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(zoom.scroll<=zoom.client+1,'200% text enlargement must not overflow');
    }
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    await page.screenshot({path:new URL(width+'-viewport.jpg',output).pathname,quality:75});
    assert.deepEqual(failures,[],'JavaScript runtime errors');
    console.log('PASS routes and supplied inventory at '+width+'px; images load; no horizontal overflow or runtime errors');
    await page.close();
  }
  const failurePage = await browser.newPage();
  await failurePage.route('**/assets/portfolio.json', route=>route.abort());
  await failurePage.goto(base);
  await failurePage.waitForSelector('.work-grid .text-link');
  assert.equal(await failurePage.locator('.work-grid').getAttribute('aria-busy'),'false');
  assert.equal(await failurePage.locator('.work-grid .text-link').getAttribute('href'),'https://f.io/ridx8b_y');
  await failurePage.close();
  const playerPage = await browser.newPage();
  await playerPage.route('**/assets/portfolio.json', async route=>{
    const response=await route.fetch();
    const manifest=await response.json();
    manifest.public[0].src='assets/media/playback-test.mp4';
    await route.fulfill({json:manifest});
  });
  await playerPage.route('**/assets/media/playback-test.mp4', route=>route.fulfill({status:200,contentType:'video/mp4',body:''}));
  await playerPage.goto(base);
  const opener=playerPage.locator('.work-visual').first();
  await opener.click();
  assert.equal(await playerPage.locator('.video-dialog').evaluate(dialog=>dialog.open),true);
  await playerPage.keyboard.press('Escape');
  await playerPage.waitForFunction(()=>!document.querySelector('.video-dialog').open && !document.querySelector('.video-player').hasAttribute('src'));
  assert.equal(await opener.evaluate(element=>element===document.activeElement),true);
  await playerPage.close();
  console.log('PASS manifest failure fallback and dialog open/Escape/cleanup/focus restoration (playback codec not tested)');
} finally { await browser.close(); }
