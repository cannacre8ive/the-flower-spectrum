// Print-ready label art for a classified flower. Sizes are 300 px per inch.
import {bandSegments,blendName} from './engine.js';
import {fingerprint,escapeXML as esc} from './visuals.js';
export const LABELS=[
 {id:'jar',title:'Jar label',size:[900,600],shape:'3 × 2 in',description:'Fingerprint, name, strip and the three leading terpenes. Sized for the front of a jar or pouch.'},
 {id:'round',title:'Round seal',size:[600,600],shape:'2 in round',description:'The fingerprint as a mark. For lids, bags and tamper seals.'},
 {id:'strip',title:'Shelf strip',size:[1200,300],shape:'4 × 1 in',description:'A slim band for shelf edges and box ends. The strip does the talking.'}
];
// Ten digits, one per fixed sector, each 0 to 9 relative to the leading profile.
export function spectrumCode(c){
 const order=['gas_fuel','earthy_dank','citrus_bright','fruity_sweet','floral_soft','dessert_creamy','spicy_warm','piney_fresh','herbal_woody','tropical_tangy'];
 const by=Object.fromEntries(c.ranked.map(p=>[p.key,p.pct])),max=Math.max(...Object.values(by),1);
 return 'FS·'+order.map(k=>Math.round(9*(by[k]||0)/max)).join('');
}
const serif='Newsreader,Georgia,serif',sans='DM Sans,Arial,sans-serif';
const t=(x,y,v,size,fill,font=sans,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-family="${font}" font-size="${size}" ${extra}>${esc(v)}</text>`;
function fp(c,x,y,size,dark){return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 500 500">${fingerprint(c,{dark}).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`;}
function band(c,x,y,w,h){let o=x;return bandSegments(c).map(p=>{const bw=w*p.frac,s=`<rect x="${o.toFixed(2)}" y="${y}" width="${bw.toFixed(2)}" height="${h}" fill="${p.color}"/>`;o+=bw;return s;}).join('');}
const fit=(value,size,max,per=.52)=>Math.min(size,Math.floor(max/(Math.max(value.length,1)*per)));
export function labelSVG(kind,flower,{farm='',dark=false}={}){
 const L=LABELS.find(l=>l.id===kind)||LABELS[0],[w,h]=L.size,c=flower.c,blend=blendName(c);
 const bg=dark?'#151713':'#f4f0e6',ink=dark?'#eee9dd':'#191c17',soft=dark?'#b4b7a6':'#515847',rule=dark?'#414837':'#c9c4b4';
 const top=flower.panel.slice(0,3),code=spectrumCode(c),total=flower.totalTerp.toFixed(2)+'% total terpenes';
 let a=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(L.title+' for '+flower.name)}"><title>${esc(L.title+' — '+flower.name)}</title>`;
 if(kind==='round'){
  a+=`<circle cx="300" cy="300" r="298" fill="${bg}"/><circle cx="300" cy="300" r="284" fill="none" stroke="${rule}" stroke-width="2"/>`+fp(c,105,58,390,dark);
  a+=t(300,476,flower.name,fit(flower.name,40,400),ink,serif,'text-anchor="middle"')+t(300,510,blend+' · '+code,17,soft,sans,'text-anchor="middle"');
  a+=`<clipPath id="arc"><circle cx="300" cy="300" r="284"/></clipPath><g clip-path="url(#arc)">${band(c,0,540,600,60)}</g>`;
 }else if(kind==='strip'){
  a+=`<rect width="${w}" height="${h}" fill="${bg}"/>`+fp(c,24,24,252,dark);
  a+=t(310,112,flower.name,fit(flower.name,76,620),ink,serif)+t(312,158,blend+'  ·  '+total,22,soft)+band(c,310,196,850,44);
  a+=t(310,274,top.map(p=>p[0]+' '+p[1].toFixed(2)+'%').join('   '),19,soft)+t(1160,274,code,19,soft,sans,'text-anchor="end"');
  if(farm)a+=t(1160,62,farm,20,soft,sans,'text-anchor="end"');
 }else{
  a+=`<rect width="${w}" height="${h}" fill="${bg}"/><rect x="14" y="14" width="${w-28}" height="${h-28}" fill="none" stroke="${rule}" stroke-width="2"/>`+fp(c,40,96,400,dark);
  a+=t(48,70,farm||'Flower Spectrum',22,soft)+t(852,70,code,22,soft,sans,'text-anchor="end"');
  a+=t(470,208,flower.name,fit(flower.name,70,380),ink,serif)+t(472,250,blend+' / '+c.confidence,23,soft)+band(c,470,278,382,34);
  top.forEach((p,i)=>{a+=t(470,364+i*40,p[0],23,ink)+t(852,364+i*40,p[1].toFixed(2)+'%',23,ink,sans,'text-anchor="end"');});
  a+=`<path d="M470 470H852" stroke="${rule}" stroke-width="2"/>`+t(470,508,total,21,soft)+t(48,552,'Aroma identity from the terpene panel',17,soft);
 }
 return a+'</svg>';
}
