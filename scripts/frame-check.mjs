import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SPIKE_TEST_BASE||'http://127.0.0.1:8765/';
const manifest=JSON.parse(await fs.readFile(new URL('../site/assets/portfolio.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true,...(process.env.SPIKE_CHROMIUM_EXECUTABLE?{executablePath:process.env.SPIKE_CHROMIUM_EXECUTABLE}:{})});
try {
 for(const [route,group,width] of [['','public',1440],['coldwell/','coldwell',390]]) {
  const item=manifest[group][0];
  const page=await browser.newPage({viewport:{width,height:1000}});
  const errors=[],frameWarnings=[];
  page.on('pageerror',error=>{
   if(error.message.startsWith('Minified React error #418;')) frameWarnings.push('Frame.io recoverable hydration warning');
   else errors.push(error.message);
  });
  await page.goto(base+route);
  const opener=page.getByRole('button',{name:'Play '+item.title,exact:true});
  await opener.click();
  const dialog=page.locator('.video-dialog');
  assert.equal(await dialog.evaluate(d=>d.open),true);
  assert.equal(await page.locator('.frame-player').getAttribute('src'),item.frameUrl);
  const external=page.getByRole('link',{name:'Open in Frame.io'});
  assert.equal(await external.getAttribute('href'),item.frameUrl);
  assert.ok(await external.isVisible());
  assert.equal(await page.locator('.video-player').isVisible(),false);
  const frame=page.frameLocator('.frame-player');
  await frame.locator('body').filter({hasText:item.filename}).waitFor({timeout:60000});
  await frame.locator('video').first().waitFor({state:'attached',timeout:45000});
  const video=frame.locator('video').first();
  await video.evaluate(v=>v.play().catch(()=>{}));
  await video.evaluate(async v=>{
   const deadline=Date.now()+30000;
   while((v.readyState<2||v.currentTime<=0)&&Date.now()<deadline) await new Promise(resolve=>setTimeout(resolve,200));
  });
  const playback=await video.evaluate(v=>({width:v.videoWidth,height:v.videoHeight,ready:v.readyState,time:v.currentTime}));
  assert.ok(playback.width>0&&playback.height>0&&playback.ready>=2&&playback.time>0,'Frame.io must decode and play actual supplied video');
  const dimensions=await dialog.evaluate(d=>({width:d.getBoundingClientRect().width,viewport:innerWidth}));
  assert.ok(dimensions.width<=dimensions.viewport,'Frame dialog must fit the viewport');
  await page.screenshot({path:new URL('../.test-output/frame-'+group+'.png',import.meta.url).pathname});
  await page.locator('.dialog-close').click();
  await page.waitForFunction(()=>!document.querySelector('.video-dialog').open&&!document.querySelector('.frame-player'));
  assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
  await opener.click();
  await page.locator('.dialog-close').focus();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.video-dialog').open&&!document.querySelector('.frame-player'));
  assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
  assert.deepEqual(errors,[]);
  if(frameWarnings.length) console.log('NOTE '+frameWarnings[0]+'; viewer and playback recovered');
  console.log('PASS actual Frame.io '+group+' individual video viewer at '+width+'px; external fallback; close/Escape cleanup and focus restoration');
  await page.close();
 }
} finally {await browser.close();}
