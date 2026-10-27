const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const routes=['spectrum','terpenes','studio','buyers'];
const aliases={profiles:'spectrum',playground:'spectrum/compose',wholesale:'buyers'};
const aboutRoutes=['story','system','gallery'];
let active='',lastSpectrum='spectrum';
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function resolve(value){const raw=value.replace(/^#/,'');return aliases[raw]||(['spectrum/compose',...routes].includes(raw)?raw:'spectrum');}
function navigate(value,{historyMode='push',focus=false,animate=true}={}){
 const route=resolve(value),key=route.split('/')[0],compose=route==='spectrum/compose';
 const changed=active!==route;
 if(key==='spectrum')lastSpectrum=route;
 if(historyMode==='push'&&location.hash!=='#'+route)history.pushState(null,'','#'+route);
 if(historyMode==='replace')history.replaceState(null,'','#'+route);
 $$('.workspace-panel').forEach(p=>p.hidden=p.id!=='panel-'+key);
 $$('[data-route]').forEach(b=>{const selected=b.dataset.route===key;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
 $('#profiles').hidden=compose;$('#playground').hidden=!compose;
 $$('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.mode==='compose')===compose)));
 active=route;
 if(changed){
  window.scrollTo({top:0,behavior:'instant'});
  const panel=$('#panel-'+key);
  if(animate&&!reduce())panel.animate([{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.7,.3,1)'});
  if(focus){const h=panel.querySelector('section:not([hidden]) h2');h.tabIndex=-1;h.focus({preventScroll:true});}
 }
 document.title=({spectrum:'Spectrum explorer',terpenes:'Terpene library',studio:'Social studio',buyers:'Buyer sheets'}[key])+' — The Flower Spectrum';
}
$$('[data-route]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route==='spectrum'?lastSpectrum:b.dataset.route)));
$('.workspace-tabs').addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();const tabs=$$('[data-route]'),i=tabs.indexOf(document.activeElement);
 const n=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;
 tabs[n].focus({preventScroll:true});tabs[n].scrollIntoView({block:'nearest',inline:'nearest',behavior:reduce()?'instant':'smooth'});tabs[n].click();
});
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.mode==='compose'?'spectrum/compose':'spectrum')));
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const hash=a.getAttribute('href').slice(1);
 if([...routes,...Object.keys(aliases),'spectrum/compose'].includes(hash)){e.preventDefault();navigate(hash,{focus:true});}
});
document.addEventListener('fs-navigate',e=>navigate(e.detail,{focus:true}));
const about=$('#about-dialog');
function openAbout(){if(!about.open)about.showModal();document.body.style.overflow='hidden';}
$$('[data-about]').forEach(b=>b.addEventListener('click',openAbout));
$('#about-close').addEventListener('click',()=>about.close());
about.addEventListener('close',()=>document.body.style.overflow='');
function fromURL(){const hash=location.hash.slice(1);navigate(hash,{historyMode:'none'});if(aboutRoutes.includes(hash))openAbout();}
window.addEventListener('popstate',fromURL);
window.addEventListener('hashchange',fromURL);
const initial=location.hash.slice(1);
navigate(initial,{historyMode:'replace',animate:false});
if(aboutRoutes.includes(initial))openAbout();
