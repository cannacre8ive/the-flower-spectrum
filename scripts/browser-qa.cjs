const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[],fails=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)fails.push([r.status(),r.url()]);});
const base=process.env.SITE_URL||'http://localhost:4173';
await page.goto(base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
for(let i=0;i<10;i++){await page.locator(`[data-profile="${i}"]`).click();assert.equal(await page.locator(`[data-profile="${i}"]`).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#profile-fingerprint svg path[fill]').count(),20);}
checks.push('All ten profile controls update the active profile and fingerprint');
await page.locator('[data-profile="2"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-profile="3"]').getAttribute('aria-pressed'),'true');checks.push('Profile keyboard navigation');
for(const [id,name] of [['jb','Earth-Spicy'],['sdr','Citrus-Floral'],['km','Citrus-Floral']]){await page.locator('#sample-select').selectOption(id);assert.equal(await page.locator('#lab-blend').textContent(),name);}
checks.push('Three historical presets produce expected identities');
const before=await page.locator('#lab-preview').innerHTML();
await page.locator('#terp-linalool').fill('1.5');await page.locator('#terp-linalool').dispatchEvent('input');assert.equal(await page.locator('#sample-status').textContent(),'Illustrative blend');assert.notEqual(await page.locator('#lab-preview').innerHTML(),before);checks.push('Slider updates all outputs and labels edited data illustrative');
for(const view of ['fingerprint','card','strip']){
 await page.locator(`[data-view="${view}"]`).click();
 const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export-svg').click()]);
 const file=await download.path(),s=await fs.readFile(file,'utf8');assert.ok(s.includes('Illustrative blend'));assert.ok(s.startsWith('<svg'));assert.ok(download.suggestedFilename().includes(view));
}
checks.push('Three preview formats and three real SVG downloads');
await page.locator('#clear-lab').click();assert.equal(await page.locator('#export-svg').isDisabled(),true);assert.ok((await page.locator('#lab-preview').textContent()).includes('Every signature'));await page.locator('#reset-lab').click();assert.equal(await page.locator('#sample-status').textContent(),'Historical sample');assert.equal(await page.locator('#export-svg').isDisabled(),false);checks.push('Clear, empty state, disabled download and reset');
await page.locator('.method summary').click();assert.ok(await page.locator('.method-grid').isVisible());
for(const key of ['strip','palette','type','card','fingerprint']){await page.locator(`[data-component="${key}"]`).click();assert.equal(await page.locator('#system-panel').getAttribute('aria-labelledby'),`tab-${key}`);}
await page.locator('[data-component="fingerprint"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-component="strip"]').getAttribute('aria-selected'),'true');checks.push('System tabs, keyboard navigation and method disclosure');
for(const [filter,count] of [['citrus',2],['floral',3],['spicy',3],['fruity',1],['all',8]]){await page.locator(`[data-filter="${filter}"]`).click();assert.equal(await page.locator('.gallery-card:visible').count(),count);}
checks.push('All gallery filters');
await page.locator('[data-card="gmo"]').click();assert.ok(await page.locator('#card-dialog').isVisible());assert.equal(await page.locator('#dialog-title').textContent(),'GMO');await page.keyboard.press('Escape');assert.equal(await page.locator('#card-dialog').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.dataset.card),'gmo');checks.push('Specimen dialog, Escape and focus restoration');
await page.locator('[data-profile="2"]').click();await page.locator('[data-view="fingerprint"]').click();await page.locator('[data-component="fingerprint"]').click();await page.locator('.method summary').click();
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:1000});
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0);});
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)}));
 assert.equal(state.scroll,state.width,`Horizontal overflow at ${width}`);assert.deepEqual(state.broken,[]);
 if(width===1440){await page.screenshot({path:'docs/desktop.png',fullPage:true});await page.screenshot({path:'docs/hero.png'});}
 if(width===390)await page.screenshot({path:'docs/mobile.png',fullPage:true});
}
checks.push('320, 390, 768 and 1440px layouts: no horizontal overflow, all images loaded');
await page.setViewportSize({width:1440,height:1000});await page.locator('#playground').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/fingerprint-lab.png'});
await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');checks.push('Reduced motion respected');
await page.goto(base+'/#system',{waitUntil:'networkidle'});assert.ok(await page.locator('#system-panel').isVisible());checks.push('Fresh-load section deep link');
assert.deepEqual(errors,[]);assert.deepEqual(fails,[]);checks.push('No browser exceptions or failed HTTP assets');
await fs.writeFile('docs/browser-qa.json',JSON.stringify({base,checks,errors,fails},null,2));console.log(JSON.stringify({checks,errors,fails},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
