import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SPIKE_TEST_BASE||'http://127.0.0.1:8765/filmstarr-spike/';
const proxyDir=new URL('../.runtime/preview-videos/',import.meta.url);
const browser=await chromium.launch({headless:true,...(process.env.SPIKE_CHROMIUM_EXECUTABLE?{executablePath:process.env.SPIKE_CHROMIUM_EXECUTABLE}:{})});
try {
 const page=await browser.newPage();
 await page.route('https://github.com/moey823/filmstarr-spike/releases/download/spike-media/*.mp4',async route=>{
  const name=path.basename(new URL(route.request().url()).pathname);
  const body=await fs.readFile(new URL(name,proxyDir));
  await route.fulfill({status:200,contentType:'video/mp4',body});
 });
 await page.goto(base);
 for(const title of ['Save My Serato Recut','Digital DJ Pool App Promo']){
  const opener=page.getByRole('button',{name:'Play '+title,exact:true});
  await opener.click();
  await page.waitForFunction(()=>{const v=document.querySelector('.video-player');return v.readyState>=2&&v.currentTime>0;},null,{timeout:20000});
  const state=await page.locator('.video-player').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,paused:v.paused}));
  assert.ok(state.width>0&&state.height>0&&state.duration>20&&!state.paused,title+' must decode and play');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('.video-dialog').open&&!document.querySelector('.video-player').hasAttribute('src'));
  assert.equal(await opener.evaluate(element=>element===document.activeElement),true);
  console.log('PASS actual supplied preview decodes and plays: '+title+' '+JSON.stringify(state));
 }
}finally{await browser.close();}
