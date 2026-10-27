import { PROFILES, bandSegments } from './engine.js';
export const escapeXML = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const point=(r,a)=>[250+r*Math.cos(a),250+r*Math.sin(a)].map(n=>n.toFixed(2)).join(' ');
export function wedge(inner,outer,start,end){return `M${point(inner,start)} L${point(outer,start)} A${outer} ${outer} 0 0 1 ${point(outer,end)} L${point(inner,end)} A${inner} ${inner} 0 0 0 ${point(inner,start)} Z`;}
export function fingerprint(c,{dark=false,labels=false}={}){
 if(!c)return '';
 const scores=Object.fromEntries(c.ranked.map(p=>[p.key,p.pct])),max=Math.max(...Object.values(scores),1),guide=dark?'#778367':'#6e7758';
 const description=PROFILES.map(p=>`${p.label}: ${scores[p.key]||0} model score percent`).join('; ');
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" class="fingerprint" role="img" aria-label="Aroma fingerprint. ${escapeXML(description)}"><title>Aroma fingerprint: fixed positions, strength relative to the leading profile</title>`;
 for(const r of [54,100,148,196]) svg+=`<circle cx="250" cy="250" r="${r}" fill="none" stroke="${guide}" stroke-width="${r===196?1:.7}" opacity=".5" ${r!==196?'stroke-dasharray="2 5"':''}/>`;
 PROFILES.forEach((p,i)=>{
  const start=-Math.PI/2+i*Math.PI/5+.025,end=start+Math.PI/5-.05,v=scores[p.key]||0,r=54+142*v/max;
  svg+=`<path d="${wedge(54,196,start,end)}" fill="${p.color}" opacity=".06"/>`;
  if(v>0)svg+=`<path d="${wedge(54,r,start,end)}" fill="${p.color}" opacity=".96"><title>${escapeXML(p.label)}: ${v}% of modeled aroma score</title></path>`;
  if(labels){const a=(start+end)/2,pos=point(222,a);svg+=`<text x="${pos.split(' ')[0]}" y="${pos.split(' ')[1]}" text-anchor="middle" dominant-baseline="central" fill="${dark?'#c5cdbb':'#525d42'}" font-family="Arial,sans-serif" font-size="13">${p.short}</text>`;}
 });
 svg+=`<circle cx="250" cy="250" r="7" fill="${c.ranked[0].color}"/><path d="M250 26v10M250 464v10M26 250h10M464 250h10" stroke="${guide}" stroke-width="1"/></svg>`;
 return svg;
}
export function strip(c,labels=false){return `<div class="spectrum-strip" role="img" aria-label="Spectrum strip: ${bandSegments(c).map(p=>`${p.label}, ${Math.round(p.frac*100)}% of strip`).join('; ')}">${bandSegments(c).map(p=>`<span style="flex:${p.frac};background:${p.color}">${labels?p.short:''}</span>`).join('')}</div>`;}
export function illustrativeProfile(index){const arr=PROFILES.map((p,i)=>({...p,pct:i===index?62:i===(index+2)%10?21:i===(index+7)%10?10:1}));return {ranked:arr.sort((a,b)=>b.pct-a.pct),confidence:'Illustrative',totalTerp:0};}
export function exportArtwork(c,{view='fingerprint',name='Custom blend',status='Illustrative blend'}={}){
 const inner=fingerprint(c,{labels:true}).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 const seg=bandSegments(c);let x=40;
 const band=seg.map(p=>{const w=p.frac*520,s=`<rect x="${x}" y="${view==='strip'?162:620}" width="${w}" height="${view==='strip'?60:20}" fill="${p.color}"/>`;x+=w;return s;}).join('');
 if(view==='fingerprint')return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 680"><rect width="600" height="680" fill="#f4f0e6"/><text x="40" y="45" font-family="Georgia" font-size="24" fill="#191c17">The Flower Spectrum</text><svg x="50" y="65" width="500" height="500" viewBox="0 0 500 500">${inner}</svg><text x="40" y="595" font-family="Georgia" font-size="32" fill="#191c17">${escapeXML(name)}</text><text x="40" y="630" font-family="Arial" font-size="12" fill="#515847">${escapeXML(status)} · Model-derived aroma identity</text><text x="40" y="652" font-family="Arial" font-size="10" fill="#515847">Design: Spencer Gray / The Flower Spectrum</text></svg>`;
 if(view==='strip')return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 280"><rect width="600" height="280" fill="#f4f0e6"/><text x="40" y="45" font-family="Arial" font-size="12" fill="#515847">THE FLOWER SPECTRUM</text><text x="40" y="102" font-family="Georgia" font-size="38" fill="#191c17">${escapeXML(name)}</text><text x="40" y="132" font-family="Arial" font-size="12" fill="#515847">${seg.map(p=>escapeXML(p.label)).join(' / ')}</text>${band}<text x="40" y="251" font-family="Arial" font-size="11" fill="#515847">${escapeXML(status)} · Design: Spencer Gray</text></svg>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 730"><rect width="600" height="730" fill="#f4f0e6"/><text x="40" y="45" font-family="Georgia" font-size="24" fill="#191c17">The Flower Spectrum</text><svg x="50" y="55" width="500" height="500" viewBox="0 0 500 500">${inner}</svg><text x="40" y="572" font-family="Georgia" font-size="38" fill="#191c17">${escapeXML(name)}</text><text x="40" y="603" font-family="Arial" font-size="13" fill="#515847">${seg.map(p=>escapeXML(p.label)).join(' / ')}</text>${band}<text x="40" y="678" font-family="Arial" font-size="12" fill="#515847">${escapeXML(status)} · Aroma classification, not effects prediction</text><text x="40" y="703" font-family="Arial" font-size="10" fill="#515847">Design: Spencer Gray / The Flower Spectrum</text></svg>`;
}
