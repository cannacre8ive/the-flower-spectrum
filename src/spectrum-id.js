// Landing page previews and the free Spectrum ID tool: lab report in, identity kit out.
import {PROFILES,STRAINS,classify,bandSegments,blendName} from './engine.js';
import {fingerprint,strip,exportArtwork,escapeXML as esc} from './visuals.js';
import {profileContent} from './content.js';
import {parseCOA,extractFromPages,LABELS as TERPENE_LABELS} from './coa.js';
import {FORMATS,PHOTO_FORMAT,PROFILE_FORMAT,socialSVG,saveSocial,saveFile,pngBlob} from './social-designs.js';
import {LABELS,labelSVG,spectrumCode} from './labels.js';
import {kitBuyerSheet,kitBuyerDocument} from './buyer-sheet.js';
import {CLIP,drawClip,clipFonts,clipMime,recordClip} from './clip.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const isDark=()=>document.documentElement.dataset.theme!=='light';
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
const slug=s=>String(s||'flower').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'flower';

/* ---------- Shared: turn terpene values into everything the designs need ---------- */
export function aromaLine(c){
 const segs=bandSegments(c),lead=profileContent[PROFILES.findIndex(p=>p.key===segs[0].key)];
 const notes=lead.notes.replace(/\.$/,'').split('. ').join(', ').toLowerCase();
 const support=segs.slice(1).map(s=>profileContent[PROFILES.findIndex(p=>p.key===s.key)].name.toLowerCase());
 return `${lead.name}-forward: ${notes}.`+(support.length?` ${support.join(' and ').replace(/^./,m=>m.toUpperCase())} in support.`:'');
}
export function describe(values,name){
 const kept=Object.fromEntries(Object.entries(values).filter(([,v])=>v>0)),c=classify(kept);if(!c)return null;
 const panel=Object.entries(kept).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[TERPENE_LABELS[k]||k,v]);
 return {id:'your-flower',name,values:kept,c,panel,totalTerp:panel.reduce((a,p)=>a+p[1],0),aroma:aromaLine(c),code:spectrumCode(c),leadIndex:PROFILES.findIndex(p=>p.key===c.ranked[0].key)};
}

/* ---------- Landing ---------- */
const km=STRAINS.find(s=>s.id==='km'),kmFlower=describe(km.values,km.name);
function renderLanding(){
 $('#landing-fingerprint').innerHTML=fingerprint(kmFlower.c,{dark:isDark(),labels:true});
 $('#landing-caption').innerHTML=`<strong>${km.name}</strong><span>${blendName(kmFlower.c)} · Spectrum ID ${kmFlower.code}</span>${strip(kmFlower.c)}<small>Historical sample, July 2023</small>`;
 $('#landing-tiles').innerHTML=[
  ['Fingerprint ID','Ten fixed sectors. One shape that belongs to your flower.',fingerprint(kmFlower.c,{dark:isDark()})],
  ['Label art','Jar labels, round seals and shelf strips at print size.',labelSVG('jar',kmFlower,{farm:'Ideal Cannabis'})],
  ['Social graphics','Feed, story and portrait posts at full resolution.',socialSVG('highlight',km)],
  ['Short clip and captions','A vertical animation of your fingerprint, with words to post beside it.',socialSVG('fingerprint',km)]
 ].map(([title,copy,art],i)=>`<a class="kit-tile" href="#id"><div class="kit-tile-art" data-tile="${i}">${art}</div><h3>${title}</h3><p>${copy}</p></a>`).join('');
}
renderLanding();

/* ---------- Reading a report ---------- */
let flower=null,photo=null,kit='social',socialIndex=0,labelIndex=0,labelDark=false,clipFrame=0,busy=false;
const status=(message,error=false)=>{$('#fsid-status').textContent=message;$('#fsid-status').classList.toggle('error',error);};
let pdfReady;
function loadPdfjs(){
 return pdfReady||(pdfReady=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/pdfjs/pdf.min.js';
  s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='/vendor/pdfjs/pdf.worker.min.js';resolve(window.pdfjsLib);};
  s.onerror=()=>{pdfReady=null;reject(Error('The PDF reader could not load. Check your connection and try again.'));};document.head.append(s);}));
}
async function readReport(file){
 if(busy)return;busy=true;status(`Reading ${file.name}…`);
 try{
  let text,page=null,scanned=false;
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
   const lib=await loadPdfjs(),doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,pages=[];
   for(let i=1;i<=doc.numPages;i++){status(`Scanning page ${i} of ${doc.numPages}…`);const p=await doc.getPage(i);pages.push({items:(await p.getTextContent()).items,width:p.getViewport({scale:1}).width});}
   const found=extractFromPages(pages);text=found.text;page=found.page;scanned=found.textLength<40;
  }else text=await file.text();
  accept(parseCOA(text),{file:file.name,page,scanned});
 }catch(e){status(e?.name==='PasswordException'?'This PDF is password protected. Remove the password and try again.':(e?.message||'This file could not be read.'),true);}
 finally{busy=false;$('#fsid-file').value='';}
}
function accept(parsed,{file='',page=null,scanned=false,defaults={},sample=false}={}){
 $('#fsid-sample-note').hidden=!sample;if(!sample)sampleMeta=null;
 const count=Object.values(parsed.values).filter(v=>v>0).length;
 if(count<2){
  status(scanned?'This PDF is a scan with no readable text, so we could not find the terpene table. Paste the terpene results below instead.'
   :'We could not find a terpene panel in this report. A Spectrum ID is built from terpene results, so the report needs to include them. Ask your lab for the terpene analysis, or paste the table below.',true);
  $('#fsid-paste-wrap').open=true;return false;
 }
 flower={values:{...parsed.values},matched:parsed.matched,unmapped:parsed.unmapped,thc:parsed.thc,reportedTotal:parsed.reportedTotal,page,file};
 $('#fsid-name').value=defaults.name||parsed.meta.product||file.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()||'';
 if(defaults.farm!=null)$('#fsid-farm').value=defaults.farm;
 if(defaults.handle!=null)$('#fsid-handle').value=defaults.handle;
 $('#fsid-start').hidden=true;$('#fsid-result').hidden=false;
 status(sample?`Read ${count} terpenes from the Grape Diamonds lab results. Step through the values, then the kit below.`:`Read ${count} terpenes${page?` from page ${page}`:''}${file?` of ${file}`:''}. Check them against your report.`);
 renderRows();render();$('#fsid-card').scrollIntoView({block:'nearest'});return true;
}
function renderRows(){
 const rows=Object.entries(flower.values).sort((a,b)=>b[1]-a[1]);
 $('#fsid-count').textContent=`${rows.length} terpenes +`;
 $('#fsid-rows').innerHTML=rows.map(([key,value])=>{const raw=flower.matched.filter(m=>m.key===key),guess=raw.some(m=>m.guess);
  return `<tr><th scope="row">${esc(TERPENE_LABELS[key])}</th><td>${raw.map(m=>esc(m.raw)).join(' + ')||'—'}${raw.length>1?' <em>added together</em>':''}${guess?' <em>check this value</em>':''}</td><td><input type="number" inputmode="decimal" min="0" max="20" step="0.01" value="${value}" data-value="${key}" aria-label="${esc(TERPENE_LABELS[key])} percent by mass"></td></tr>`;}).join('');
 $('#fsid-unmapped').innerHTML=flower.unmapped.length?`<p class="fsid-help"><strong>Shown on the report, not used:</strong> ${flower.unmapped.map(u=>`${esc(u.raw)} ${u.value}% (${esc(u.reason)})`).join('; ')}.</p>`:'';
}
const farm=()=>$('#fsid-farm').value.trim()||'Your farm',handle=()=>$('#fsid-handle').value.trim()||'@yourfarm';
let sampleMeta=null;
const buyerOpts=()=>({farm:farm(),thc:flower?.thc??null,reportedTotal:flower?.reportedTotal??null,harvest:sampleMeta?.harvest||'',source:sampleMeta?'Real example, shown with the grower’s approval':'From the lab report'});
const now=()=>describe(flower.values,$('#fsid-name').value.trim()||'Your flower');

/* ---------- Result ---------- */
function totalStat(f){
 const reported=flower.reportedTotal>0?flower.reportedTotal:null,value=(reported??f.totalTerp).toFixed(2)+'%';
 return {value,label:reported?'total terpenes · lab report':'terpenes read from the report',line:value+' terpenes'};
}
function socialFormats(){return [...(photo?[PHOTO_FORMAT]:[]),PROFILE_FORMAT,...FORMATS.filter(f=>f.id!=='compare')];}
function socialArt(f,format){return socialSVG(format.id,{...f,thc:flower.thc},{farm:farm(),handle:handle(),profileCopy:profileContent[f.leadIndex],footer:'From the lab report · Aroma model, not an effects claim',stat:totalStat(f),dropKicker:'New drop',photo:photo?.url});}
function clipData(f){return {name:f.name,farm:farm(),handle:handle(),blend:blendName(f.c),ranked:f.c.ranked,segments:bandSegments(f.c),top:f.panel,total:f.totalTerp,code:f.code,photo:photo?.image||null};}
function captions(f){
 const [a,b,c]=f.panel,lead=profileContent[f.leadIndex],blend=blendName(f.c),who=$('#fsid-farm').value.trim(),segs=bandSegments(f.c),second=segs[1]&&profileContent[PROFILES.findIndex(p=>p.key===segs[1].key)].name.toLowerCase();
 const tops=[a,b,c].filter(Boolean).map(p=>`${p[0]} ${p[1].toFixed(2)}%`),list=tops.length>1?tops.slice(0,-1).join(', ')+' and '+tops[tops.length-1]:tops[0];
 return [
  ['Launch post',`Meet ${f.name}${who?` from ${who}`:''}. Its Spectrum ID reads ${blend}: ${lead.notes.toLowerCase().replace(/\.$/,'').split('. ').join(', ')}. The lab report shows ${list}, with ${totalStat(f).value} total terpenes.\n\n#terpenes #flowerspectrum`],
  ['Beyond the number',`There is more to ${f.name} than a THC number. Its terpene panel puts ${lead.name.toLowerCase()} out front${second?`, with ${second} close behind`:''}. Every flower has a signature. This one is ours.\n\n#terpenes #trustyournose`],
  ['Short and plain',`${f.name} · ${blend} · ${totalStat(f).value} terpenes · Spectrum ID ${f.code}`]
 ];
}
function render(){
 if(!flower)return;const f=now();
 if(!f){$('#fsid-card').innerHTML='<p class="empty-state">Every value is 0.<br>Enter at least one terpene to draw a fingerprint.</p>';$('#kit-stage').innerHTML='';$('#kit-info').innerHTML='';return;}
 const c=f.c,stat=totalStat(f);
 $('#fsid-card').innerHTML=`<div class="fsid-card-top"><span>Spectrum ID</span><span>${f.code}</span></div>${fingerprint(c,{dark:isDark(),labels:true})}<h3>${esc(f.name)}</h3><p class="fsid-blend" style="color:${isDark()?c.ranked[0].color:'inherit'}">${blendName(c)} <span>/ ${c.confidence}</span></p>${strip(c,true)}<p class="fsid-aroma">${esc(f.aroma)}</p><dl class="fsid-stats"><div><dt>${stat.label}</dt><dd>${stat.value}</dd></div><div><dt>Leading terpene</dt><dd>${esc(f.panel[0][0])}</dd></div>${flower.thc!=null?`<div><dt>Total THC · lab report</dt><dd>${flower.thc}%</dd></div>`:''}</dl><div class="fsid-card-actions"><button class="button outline" data-save-id="card">Save ID card (SVG) <span aria-hidden="true">↓</span></button><button class="button outline" data-save-id="fingerprint">Fingerprint only <span aria-hidden="true">↓</span></button></div>`;
 renderKit(f);
}
const list=(items,active,attr)=>`<div class="format-list" role="group">${items.map((x,i)=>`<button ${attr}="${i}" aria-pressed="${i===active}"><span>${String(i+1).padStart(2,'0')}</span>${x.title}<small>${x.shape.split(' / ')[0]}</small></button>`).join('')}</div>`;
function renderKit(f=now()){
 if(!f)return;cancelAnimationFrame(clipFrame);
 $$('[data-kit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kit===kit)));
 const stage=$('#kit-stage'),info=$('#kit-info');stage.dataset.kit=kit;
 if(kit==='social'){
  const formats=socialFormats();socialIndex=Math.min(socialIndex,formats.length-1);const format=formats[socialIndex];
  stage.innerHTML=socialArt(f,format);stage.dataset.shape=format.id;
  info.innerHTML=`<p class="section-marker">${format.size.join(' × ')} px · ${format.shape.split(' / ')[1]}</p><h3>${format.title}</h3><p>${format.description}</p>${list(formats,socialIndex,'data-social')}<div class="export-actions"><button class="button light" data-export="png">Download PNG <span aria-hidden="true">↓</span></button><button class="button outline" data-export="svg">Editable SVG <span aria-hidden="true">↓</span></button><button class="button outline" data-export="share">Share <span aria-hidden="true">↗</span></button></div><p class="fine-print">${photo?'':'Add a flower photo above to unlock the portrait format. '}Full-resolution exports with your farm name and handle.</p>`;
 }else if(kit==='labels'){
  const label=LABELS[labelIndex];stage.innerHTML=labelSVG(label.id,f,{farm:$('#fsid-farm').value.trim(),dark:labelDark});stage.dataset.shape=label.id;
  info.innerHTML=`<p class="section-marker">${label.shape} · ${label.size.join(' × ')} px at 300 per inch</p><h3>${label.title}</h3><p>${label.description}</p>${list(LABELS,labelIndex,'data-label')}<label class="fsid-check"><input type="checkbox" id="label-dark" ${labelDark?'checked':''}> Dark stock</label><div class="export-actions"><button class="button light" data-export="png">Download PNG <span aria-hidden="true">↓</span></button><button class="button outline" data-export="svg">Editable SVG <span aria-hidden="true">↓</span></button></div><p class="fine-print">Design artwork only. It is not a compliance label; required regulatory content is yours to add.</p>`;
 }else if(kit==='buyer'){
  stage.dataset.shape='buyer';stage.innerHTML=`<div class="fsid-buyer">${kitBuyerSheet(f,buyerOpts())}</div>`;
  info.innerHTML=`<p class="section-marker">One page · For wholesale buyers</p><h3>Buyer sheet</h3><p>The chemovar on one page for buyers: identity, fingerprint, reported chemistry, why it lands in its profile, and every terpene read from your report. Download it, add lineage, lot, price, minimum order and contact in the dashed fields, then print it to PDF.</p><div class="export-actions"><button class="button light" data-export="buyer">Download buyer sheet <span aria-hidden="true">↓</span></button></div><p class="fine-print">Editable HTML that prints to one page. Nothing commercial is filled in for you, and nothing from your report beyond the terpene values and totals is included.</p>`;
 }else if(kit==='clip'){
  const can=!!clipMime();
  stage.innerHTML=`<canvas id="kit-canvas" width="${CLIP.width}" height="${CLIP.height}" role="img" aria-label="Animated Spectrum ID for ${esc(f.name)}: the fingerprint draws in, followed by the name, strip and leading terpenes"></canvas>`;stage.dataset.shape='clip';
  info.innerHTML=`<p class="section-marker">${CLIP.width} × ${CLIP.height} px · ${CLIP.duration} seconds · Reels and stories</p><h3>Short clip</h3><p>Your fingerprint draws itself, sector by sector, then the name, strip and leading terpenes arrive. ${photo?'Your photo moves slowly behind it.':'Add a flower photo above and it moves slowly behind the fingerprint.'}</p><div class="export-actions"><button class="button light" data-export="clip" ${can?'':'disabled'}>Download clip <span aria-hidden="true">↓</span></button><button class="button outline" data-export="replay">Play again <span aria-hidden="true">↻</span></button></div><p class="fine-print" id="clip-note">${can?`Recording takes about ${CLIP.duration} seconds and stays in your browser. Saved as ${clipMime().startsWith('video/mp4')?'MP4':'WebM'}; keep this tab in view while it records.`:'This browser cannot record video. Open this page in a current version of Chrome, Edge, Firefox or Safari to save the clip.'}</p>`;
  playClip(f);
 }else{
  stage.dataset.shape='captions';
  stage.innerHTML=captions(f).map(([title,text],i)=>`<article class="fsid-caption"><h4>${title}</h4><p>${esc(text).replace(/\n/g,'<br>')}</p><button class="text-button" data-copy="${i}">Copy caption</button></article>`).join('');
  info.innerHTML=`<p class="section-marker">Words to post beside it</p><h3>Captions</h3><p>Three starting points written from your report. Each one states what the lab measured and what the model reads from it.</p><p class="fine-print">Edit freely. Check your state’s advertising rules before you post; these captions make no effects or medical claims and you should keep it that way.</p>`;
 }
}
async function playClip(f,{once=false}={}){
 await clipFonts();const canvas=$('#kit-canvas');if(!canvas)return;const ctx=canvas.getContext('2d'),data=clipData(f);
 if(reduced()&&!once){drawClip(ctx,data,CLIP.duration);return;}
 const began=performance.now();cancelAnimationFrame(clipFrame);
 (function frame(time){if(!canvas.isConnected||canvas.dataset.recording)return;const t=(time-began)/1000,loop=CLIP.duration+1.5;
  drawClip(ctx,data,Math.min(once?t:t%loop,CLIP.duration));if(!once||t<CLIP.duration)clipFrame=requestAnimationFrame(frame);})(began);
}
function currentArt(f){
 if(kit==='labels'){const l=LABELS[labelIndex];return {svg:labelSVG(l.id,f,{farm:$('#fsid-farm').value.trim(),dark:labelDark}),name:`${slug(f.name)}-${l.id}-label`,size:l.size};}
 const format=socialFormats()[socialIndex];return {svg:socialArt(f,format),name:`${slug(f.name)}-${format.id}`,size:format.size};
}
async function shareFile(blob,filename,text){
 const file=new File([blob],filename,{type:blob.type});
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],text});return 'shared';}catch(e){if(e.name==='AbortError')return 'cancelled';}}
 saveFile(blob,filename,blob.type);try{await navigator.clipboard.writeText(text);return 'saved-copied';}catch{return 'saved';}
}
async function runExport(button){
 const f=now(),action=button.dataset.export;if(!f)return;
 if(action==='replay'){playClip(f,{once:true});return;}
 if(action==='buyer'){saveFile(kitBuyerDocument(f,buyerOpts()),`${slug(f.name)}-buyer-sheet.html`,'text/html');toast('Buyer sheet saved. Open it, fill in the dashed fields, then print to PDF.');return;}
 const old=button.innerHTML;button.disabled=true;button.textContent=action==='clip'?'Recording…':'Preparing…';
 try{
  if(action==='clip'){
   const canvas=$('#kit-canvas');cancelAnimationFrame(clipFrame);canvas.dataset.recording='1';await clipFonts();
   const {blob,extension}=await recordClip(canvas,clipData(f),p=>{button.textContent=`Recording… ${Math.round(p*100)}%`;});
   delete canvas.dataset.recording;saveFile(blob,`${slug(f.name)}-spectrum-id.${extension}`,blob.type);toast(`Clip saved as ${extension.toUpperCase()}.`);playClip(f);
  }else if(action==='share'){
   const art=currentArt(f),result=await shareFile(await pngBlob(art.svg),art.name+'.png',captions(f)[0][1]);
   toast({shared:'Shared.',cancelled:'Share cancelled.','saved-copied':'Image saved and caption copied. Paste it into your post.',saved:'Image saved. Sharing is not available in this browser.'}[result]);
  }else{const art=currentArt(f);await saveSocial(art.svg,action,art.name);toast(`${action.toUpperCase()} saved at ${art.size.join(' × ')}.`);}
 }catch(e){const canvas=$('#kit-canvas');if(canvas)delete canvas.dataset.recording;toast(e?.message||'Export could not finish. Please try again.');}
 finally{button.disabled=false;button.innerHTML=old;}
}

/* ---------- Photo ---------- */
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('That image could not be opened.'));image.src=src;});}
async function setPhoto(blob){
 const url=URL.createObjectURL(blob);
 try{const source=await loadImage(url),scale=Math.min(1,1800/Math.max(source.width,source.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale);canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);
  const data=canvas.toDataURL('image/jpeg',.88);photo={url:data,image:await loadImage(data)};socialIndex=0;
 }finally{URL.revokeObjectURL(url);}
}

/* ---------- Events ---------- */
$('#fsid-file').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)readReport(file);});
const drop=$('#fsid-drop');
['dragenter','dragover'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('over');}));
['dragleave','drop'].forEach(type=>drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('over');}));
drop.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(file)readReport(file);});
$('#fsid-demo').addEventListener('click',async e=>{
 const button=e.currentTarget;button.disabled=true;
 try{const [report,image]=await Promise.all([fetch('/assets/demo/johnny-glaze-coa.pdf'),fetch('/assets/demo/johnny-glaze-flower.jpg')]);if(!report.ok)throw Error('The sample report could not load.');
  if(image.ok)await setPhoto(await image.blob()).catch(()=>{});
  $('#fsid-farm').value='Ideal Cannabis';$('#fsid-handle').value='@idealcannabis';
  await readReport(new File([await report.blob()],'johnny-glaze-coa.pdf',{type:'application/pdf'}));
 }catch(err){status(err.message,true);}finally{button.disabled=false;}
});
/* A real, finished example: Grape Diamonds by Ideal Cannabis, shared with the grower's approval.
   Only the terpene values transcribed from its lab report are published, never the report itself. */
const sampleButtons=()=>document.querySelectorAll('[data-run-sample]');
async function runSample(){
 if(busy)return;busy=true;sampleButtons().forEach(b=>b.setAttribute('aria-busy','true'));status('Loading the Grape Diamonds example…');
 try{const [values,image]=await Promise.all([fetch('/assets/demo/grape-diamonds-terpenes.txt'),fetch('/assets/demo/grape-diamonds-flower.jpg')]);if(!values.ok)throw Error('The example could not load. Please try again.');
  photo=null;if(image.ok)await setPhoto(await image.blob()).catch(()=>{});kit='social';socialIndex=0;
  sampleMeta={harvest:'07/21/2021'};accept(parseCOA(await values.text()),{defaults:{name:'Grape Diamonds',farm:'Ideal Cannabis',handle:'@idealcannabis'},sample:true});
 }catch(err){status(err.message,true);}finally{busy=false;sampleButtons().forEach(b=>b.removeAttribute('aria-busy'));}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-run-sample]');if(!b)return;if(b.tagName==='A')setTimeout(runSample,60);else runSample();});
document.addEventListener('click',e=>{if(!e.target.closest('[data-sample-own]'))return;document.querySelector('#fsid-reset').click();});
$('#fsid-paste-go').addEventListener('click',()=>{const text=$('#fsid-paste').value;if(!text.trim()){status('Paste the terpene rows from your report first.',true);return;}accept(parseCOA(text),{});});
$('#fsid-rows').addEventListener('input',e=>{const input=e.target.closest('[data-value]');if(!input)return;const v=Number(input.value);flower.values[input.dataset.value]=Number.isFinite(v)&&v>0?v:0;render();});
['fsid-name','fsid-farm','fsid-handle'].forEach(id=>$('#'+id).addEventListener('input',render));
$('#fsid-photo').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{await setPhoto(file);render();toast('Photo added. The portrait format is now in your kit.');}catch(err){toast(err.message);}});
$('#fsid-reset').addEventListener('click',()=>{cancelAnimationFrame(clipFrame);$('#fsid-sample-note').hidden=true;flower=null;photo=null;kit='social';socialIndex=0;$('#fsid-photo').value='';$('#fsid-result').hidden=true;$('#fsid-start').hidden=false;status('');$('#fsid-title').scrollIntoView({block:'center'});});
$$('[data-kit]').forEach(b=>b.addEventListener('click',()=>{kit=b.dataset.kit;renderKit();}));
$('#kit-info').addEventListener('click',e=>{
 const s=e.target.closest('[data-social]'),l=e.target.closest('[data-label]'),x=e.target.closest('[data-export]');
 if(s){socialIndex=Number(s.dataset.social);renderKit();}else if(l){labelIndex=Number(l.dataset.label);renderKit();}else if(x)runExport(x);
});
$('#kit-info').addEventListener('change',e=>{if(e.target.id==='label-dark'){labelDark=e.target.checked;renderKit();}});
$('#kit-stage').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;const text=captions(now())[Number(b.dataset.copy)][1];try{await navigator.clipboard.writeText(text);toast('Caption copied.');}catch{toast('Copy is not available here. Select the text instead.');}});
$('#fsid-card').addEventListener('click',e=>{const b=e.target.closest('[data-save-id]');if(!b)return;const f=now();saveFile(exportArtwork(f.c,{view:b.dataset.saveId,name:f.name,status:'From the lab report'}),`${slug(f.name)}-spectrum-${b.dataset.saveId}.svg`,'image/svg+xml');toast('Your editable SVG is saved.');});
document.addEventListener('fs-theme',()=>{renderLanding();render();});
document.addEventListener('fs-route',e=>{if(e.detail!=='id')cancelAnimationFrame(clipFrame);else if(flower&&kit==='clip')renderKit();});
