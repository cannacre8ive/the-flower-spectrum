import { PROFILES, TERPENES, STRAINS, classify, bandSegments, blendName } from './engine.js';
import { fingerprint, strip, illustrativeProfile, exportArtwork } from './visuals.js';
import { profileContent, cards } from './content.js';
import { TERPENES as LIBRARY } from './education-data.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const km=STRAINS.find(s=>s.id==='km'),kmClass=classify(km.values);
const isDark=()=>document.documentElement.dataset.theme!=='light';
$('#hero-fingerprint').innerHTML=fingerprint(kmClass,{dark:isDark()});
$('#hero-strip').innerHTML=strip(kmClass);
$('#spectrum-ribbon').innerHTML=PROFILES.map((p,i)=>`<a href="#profiles" style="background:${p.color}" data-profile-link="${i}" aria-label="Explore ${p.label}"></a>`).join('');
$('#profile-picker').innerHTML=PROFILES.map((p,i)=>`<button data-profile="${i}" aria-pressed="${i===2}" aria-label="${p.label}" style="--p-color:${p.color}"><span class="profile-dot" aria-hidden="true"></span>${profileContent[i].name}</button>`).join('');
let profileIndex=2;
function showProfile(i){
 profileIndex=i;
 const p=PROFILES[i],text=profileContent[i];
 $$('[data-profile]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.profile)===i));
 $('#profile-fingerprint').innerHTML=fingerprint(illustrativeProfile(i),{labels:true,dark:isDark(),interactive:true,active:i});
 const related=LIBRARY.filter(t=>t.profile===p.key||(t.also||[]).includes(p.key));
 const chip=t=>`<button data-open-terp="${t.key}">${t.label} ↗</button>`;
 $('#profile-description').innerHTML=`<p class="profile-pair">${text.name} / ${text.pair}</p><h3>${text.name}.</h3><p class="sensory">${text.notes}</p><p class="profile-prose">${text.description}</p><div class="profile-details"><span>Explore the associated terpenes</span><div class="profile-terps">${related.slice(0,4).map(chip).join('')}</div></div><details class="profile-extra"><summary>Inside this part of the spectrum <span>+</span></summary><p>This sector always sits in position ${i+1} of 10. ${text.drivers} are the source system’s signature associations. Select a terpene to open its educational card.</p>${related.length>4?`<div class="profile-terps">${related.slice(4).map(chip).join('')}</div>`:''}</details>`;
 $('#profile-position').textContent=(i+1)+' / 10';
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#profile-description').animate([{opacity:.2,transform:'translateX(14px)'},{opacity:1,transform:'translateX(0)'}],{duration:280,easing:'ease-out'});
 $('#profile-index').textContent=String(i+1).padStart(2,'0');
 $('#profile-stage').style.setProperty('--accent',p.color);
}
$$('[data-profile]').forEach(b=>b.addEventListener('click',()=>showProfile(Number(b.dataset.profile))));
$$('[data-profile-link]').forEach(b=>b.addEventListener('click',()=>showProfile(Number(b.dataset.profileLink))));
$('#profile-picker').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const buttons=$$('[data-profile]'),i=buttons.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?9:(i+(e.key==='ArrowRight'?1:9))%10;buttons[next].focus();showProfile(next);});
document.addEventListener('fs-profile',e=>showProfile(e.detail));
$('#profile-prev').addEventListener('click',()=>showProfile((profileIndex+9)%10));
$('#profile-next').addEventListener('click',()=>showProfile((profileIndex+1)%10));
$('#profile-fingerprint').addEventListener('click',e=>{const g=e.target.closest('[data-sector]');if(g)showProfile(Number(g.dataset.sector));});
$('#profile-fingerprint').addEventListener('keydown',e=>{const g=e.target.closest('[data-sector]');if(g&&['Enter',' '].includes(e.key)){e.preventDefault();const n=Number(g.dataset.sector);showProfile(n);$('#profile-fingerprint [data-sector="'+n+'"]').focus();}});
let atlasStart;
$('#profile-stage').addEventListener('pointerdown',e=>{if(!e.target.closest('button,summary,[role=button]'))atlasStart={x:e.clientX,y:e.clientY};});
$('#profile-stage').addEventListener('pointerup',e=>{if(!atlasStart)return;const dx=e.clientX-atlasStart.x,dy=e.clientY-atlasStart.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)showProfile((profileIndex+(dx<0?1:9))%10);atlasStart=null;});
$('#profile-stage').addEventListener('pointercancel',()=>atlasStart=null);
showProfile(2);
let values={...km.values},sample=km,custom=false,view='fingerprint',current=kmClass;
const controls=[['limonene','Limonene',2],['linalool','Linalool',4],['myrcene','Myrcene',1],['caryophyllene','Caryophyllene',6],['pinene_b','β-Pinene',7],['humulene','Humulene',8]];
$('#slider-list').innerHTML=controls.map(([key,label,i])=>`<div class="slider-line" style="--p-color:${PROFILES[i].color}"><label for="terp-${key}">${label}<output id="value-${key}" for="terp-${key}">${Number(values[key]||0).toFixed(2)}%</output></label><input type="range" min="0" max="1.5" step="0.01" value="${values[key]||0}" id="terp-${key}" data-terp="${key}" style="--fill:${(values[key]||0)/1.5*100}%" aria-valuetext="${values[key]||0} percent by mass"></div>`).join('');
function renderLab(){
 current=classify(values);const name=custom?'Your custom blend':sample.name,status=custom?'Illustrative blend':'Historical sample';
 $('#sample-status').textContent=status;
 $('#lab-total').textContent=`${(current?.totalTerp||0).toFixed(2)}% modeled terpenes`;
 $('#lab-blend').textContent=current?blendName(current):'A blank canvas.';
 $('#lab-summary').textContent=current?(custom?'Your composition. Same visual grammar.':`${sample.name} · July 2023 sample panel`):'Add a terpene to start your signature.';
 $('#export-svg').disabled=!current;
 if(!current){$('#lab-preview').innerHTML='<p class="empty-state">Every signature starts somewhere.<br>Move a slider to add your first note.</p>';return;}
 if(view==='fingerprint')$('#lab-preview').innerHTML=fingerprint(current,{dark:isDark(),labels:true});
 if(view==='card')$('#lab-preview').innerHTML=`<div class="preview-card"><div class="card-topline"><span>The Flower Spectrum</span><span>FS / ID</span></div>${fingerprint(current)}<h4>${name}</h4><p>${blendName(current)} · ${status}</p>${strip(current)}</div>`;
 if(view==='strip')$('#lab-preview').innerHTML=`<div class="preview-shelf"><div class="shelf-heading"><div><h4>${name}</h4><p style="font-size:11px;margin-top:6px">${blendName(current)}</p></div><div style="width:65px">${fingerprint(current)}</div></div>${strip(current,true)}<small>${status} · Model-derived aroma identity</small></div>`;
}
function syncSliders(){controls.forEach(([key])=>{const v=Number(values[key]||0);$(`#terp-${key}`).value=v;$(`#terp-${key}`).style.setProperty('--fill',(v/1.5*100)+'%');$(`#value-${key}`).textContent=v.toFixed(2)+'%';$(`#terp-${key}`).setAttribute('aria-valuetext',v.toFixed(2)+' percent by mass');});}
$$('[data-terp]').forEach(input=>input.addEventListener('input',()=>{values[input.dataset.terp]=Number(input.value);input.style.setProperty('--fill',(Number(input.value)/1.5*100)+'%');custom=true;$(`#value-${input.dataset.terp}`).textContent=Number(input.value).toFixed(2)+'%';input.setAttribute('aria-valuetext',Number(input.value).toFixed(2)+' percent by mass');renderLab();}));
$('#sample-select').addEventListener('change',e=>{sample=STRAINS.find(s=>s.id===e.target.value);values={...sample.values};custom=false;syncSliders();renderLab();});
$('#reset-lab').addEventListener('click',()=>{values={...sample.values};custom=false;syncSliders();renderLab();});
$('#clear-lab').addEventListener('click',()=>{values={};custom=true;syncSliders();renderLab();});
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;$$('[data-view]').forEach(btn=>btn.setAttribute('aria-pressed',btn===b));renderLab();}));
let toastTimer;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
$('#export-svg').addEventListener('click',()=>{if(!current)return;const svg=exportArtwork(current,{view,name:custom?'Your custom blend':sample.name,status:custom?'Illustrative blend':'Historical sample'}),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),a=document.createElement('a');a.href=url;a.download=`flower-spectrum-${custom?'custom':sample.id}-${view}.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your editable SVG is saved.');});
renderLab();
const components={
 fingerprint:{art:`${fingerprint(kmClass,{dark:isDark()})}<div class="scale-demo">${fingerprint(classify(STRAINS[0].values),{dark:isDark()})}${fingerprint(classify(STRAINS[1].values),{dark:isDark()})}</div>`,title:'Recognizable at every scale.',copy:'Ten fixed sectors make each signature comparable. Relative lengths reveal the character of a blend, from a small label mark to a full-scale visual identity.'},
 strip:{art:`<div class="system-strip">${strip(kmClass,true)}<div class="strip-labels"><span>Dominant profile first</span><span>Up to three profiles</span></div><div style="margin-top:40px">${strip(classify(STRAINS[0].values),true)}</div></div>`,title:'Complexity, compressed.',copy:'A proportional color band translates the loudest notes into a compact shorthand. A single color means one profile dominates; a split band describes a blend.'},
 palette:{art:`<div class="palette-demo">${PROFILES.map((p,i)=>`<div class="palette-chip"><i style="--p-color:${p.color}"></i>${profileContent[i].name}<span>${p.color}</span></div>`).join('')}</div>`,title:'Color with a job to do.',copy:'Ten colors, ten stable meanings. An earthy palette connects the system to the plant, while names and fixed positions keep color from carrying the entire message.'},
 type:{art:'<div class="type-demo"><p class="display-type">Natural character.<br>Clear information.</p><p class="body-type">Newsreader / DM Sans</p><p class="small-type">Aroma profile · Sample identity · Supporting detail</p></div>',title:'Organic meets precise.',copy:'Newsreader brings an editorial, botanical character to the names. DM Sans keeps controls, labels, and supporting details clear. Contrast comes from scale and role.'},
 card:{art:'<img class="source-profile-card" src="/assets/profiles/citrus.svg" width="495" height="458" alt="Original Citrus / Bright profile card with fingerprint, sensory notes and supporting details">',title:'A reusable unit of meaning.',copy:'The original profile card brings the ingredients together: name, sensory description, fingerprint, and color. Source copy is preserved here as design artwork; it is not a verified effects claim.'}
};
function showComponent(key){const c=components[key];$$('[data-component]').forEach(b=>{const active=b.dataset.component===key;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});$('#system-panel').setAttribute('aria-labelledby',`tab-${key}`);$('#system-panel').innerHTML=`<div class="component-art">${c.art}</div><div class="component-caption"><h3>${c.title}</h3><p>${c.copy}</p></div>`;}
$$('[data-component]').forEach(b=>b.addEventListener('click',()=>showComponent(b.dataset.component)));
$('.system-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const bs=$$('[data-component]'),i=bs.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?4:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:4))%5;bs[next].focus();showComponent(bs[next].dataset.component);});
showComponent('fingerprint');
$('#gallery-grid').innerHTML=cards.map(c=>`<button class="gallery-card" data-card="${c.id}" aria-label="Explore ${c.name}, ${c.profile}"><div class="gallery-image"><img src="/assets/cards/${c.id}.jpg" width="398" height="594" alt="${c.name} original Flower Spectrum specimen card" loading="lazy"><span class="expand-icon" aria-hidden="true">↗</span></div><div class="gallery-caption"><span>${c.source.startsWith('REAL')?'Historical reference':'Illustrative concept'}</span><span>View specimen ↗</span></div></button>`).join('');
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{const filter=b.dataset.filter;$('.artwork-archive').open=true;$$('[data-filter]').forEach(btn=>btn.setAttribute('aria-pressed',btn===b));let count=0;$$('[data-card]').forEach(btn=>{const c=cards.find(c=>c.id===btn.dataset.card);btn.hidden=filter!=='all'&&!c.filter.includes(filter);if(!btn.hidden)count++;});$('#gallery-count').textContent=`${count} specimens`;}));
const dialog=$('#card-dialog');
$$('[data-card]').forEach(b=>b.addEventListener('click',()=>{const c=cards.find(c=>c.id===b.dataset.card);$('#dialog-content').innerHTML=`<img src="/assets/cards/${c.id}.jpg" width="398" height="594" alt="${c.name} original specimen card"><div><span class="dialog-label">${c.source}</span><h3 id="dialog-title">${c.name}</h3><p>${c.profile}</p><p>${c.note}</p><p>Original artwork is preserved as supplied. The interactive lab is a separate demonstration of the underlying design rules.</p><a class="button outline" href="/assets/cards/${c.id}.jpg" download="flower-spectrum-${c.id}.jpg">Save original artwork <span aria-hidden="true">↓</span></a></div>`;dialog.showModal();document.body.style.overflow='hidden';}));
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>document.body.style.overflow='');
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});

document.addEventListener('fs-theme',()=>{renderLab();$('#hero-fingerprint').innerHTML=fingerprint(kmClass,{dark:isDark()});$('#profile-fingerprint').innerHTML=fingerprint(illustrativeProfile(profileIndex),{labels:true,dark:isDark(),interactive:true,active:profileIndex});});
