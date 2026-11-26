import {PROFILES,TERPENES,classify,bandSegments,blendName} from './engine.js';
import {fingerprint,escapeXML as esc} from './visuals.js';
export const FORMATS=[
 {id:'highlight',title:'Strain highlight',size:[1080,1080],shape:'1:1 / Feed',role:'Introduce the flower',description:'A signature launch card: strain, aroma identity, leading analytes, and a distinctive fingerprint. A coherent starting point for a farm’s feed.'},
 {id:'drop',title:'Drop announcement',size:[1080,1920],shape:'9:16 / Story',role:'Make the introduction',description:'A full-height story with room for the flower’s character. The same palette and fingerprint make a release recognizable before the reader reaches the farm name.'},
 {id:'spotlight',title:'Aroma spotlight',size:[1080,1080],shape:'1:1 / Education',role:'Give people a reason to care',description:'Explain the leading aroma profile in plain language. Educational content gives the farm a useful voice between product releases.'},
 {id:'fingerprint',title:'Fingerprint ID',size:[1080,1350],shape:'4:5 / Portrait',role:'Build recognition',description:'The visual signature becomes the hero. A portrait format made to let an individual strain’s identity stand on its own.'},
 {id:'compare',title:'Different flower. Different story.',size:[1080,1080],shape:'1:1 / Comparison',role:'Show the difference',description:'Two strains, one visual grammar. The comparison explains why aroma offers a richer conversation than a single potency number.'},
 {id:'voice',title:'Brand voice',size:[1080,1080],shape:'1:1 / Editorial',role:'Express a point of view',description:'A typographic brand statement built from the same system. A moment of perspective that still belongs unmistakably to the farm.'}
];
export const PHOTO_FORMAT={id:'photo',title:'Flower portrait',size:[1080,1350],shape:'4:5 / Portrait',role:'Let the flower lead',description:'Your photograph, full bleed, with the fingerprint and strip carrying the aroma identity. Made for the feed.'};
// The profile feature: which aroma profile the flower falls into, and why, written from its own numbers.
export const PROFILE_FORMAT={id:'profile',title:'Profile feature',size:[1080,1350],shape:'4:5 / Portrait',role:'Explain the identity',description:'Which profile your flower falls into and why: its leading terpene, what sits beside it, and how strongly it leans. Written from your numbers.'};
// Why a flower falls into its leading profile, written from its own numbers. Shared by the profile feature and the buyer sheet.
export function profileWhy(strain,c=classify(strain.values)){
 const lead=c.ranked[0],name0=lead.label.split(' / ')[0];
 const vals=Object.entries(strain.values||{}).filter(([,v])=>v>0).sort((x,y)=>y[1]-x[1]),total=vals.reduce((s,[,v])=>s+v,0)||1;
 const [topKey,topVal]=vals[0]||['',0],topT=TERPENES.find(t=>t.key===topKey),topName=(strain.panel?.[0]?.[0]||topKey).replace(/^[αβγδ]-/,'');
 const topProfile=PROFILES.find(p=>p.key===topT?.profile);
 const beside=c.ranked.slice(1,3).filter(p=>p.pct>0);
 return [
  [`${topName} leads the panel`,`${topVal.toFixed(2)}% of ${total.toFixed(2)}% measured, about ${Math.round(topVal/total*100)}% of the terpenes. `+(topProfile?.key===lead.key?`It is a main ${name0.toLowerCase()} driver.`:`It feeds the ${(topProfile?.label||'').split(' / ')[0].toLowerCase()} profile.`)],
  ['What sits beside it',beside.length?beside.map(p=>`${p.label.split(' / ')[0]} (${p.pct}%)`).join(' and ')+' round out the aroma.'+(beside.some(p=>p.key==='gas_fuel')?' Gas comes from the balance of caryophyllene, limonene and myrcene, not one terpene.':''):'Nothing else comes close.'],
  [c.confidence==='Defined'?'A clear identity':c.confidence==='Leaning'?'A confident lean':'A true blend',`${name0} leads the next profile by ${c.gap} points. `+(c.confidence==='Defined'?'That is a single, defined profile.':c.confidence==='Leaning'?'Defined needs 22, so it leans rather than sits on one note.':'Under 10 points, so no one profile owns it.')]
 ];
}
export function brandSVG(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">${PROFILES.map((p,i)=>`<rect x="${i*8}" y="0" width="8" height="28" fill="${p.color}"/>`).join('')}<text x="96" y="25" fill="#eee9dd" font-family="Newsreader,Georgia,serif" font-size="33" font-weight="600">Flower Spectrum</text></g>`;}
function text(x,y,value,size=30,color='#eee9dd',font='DM Sans,Arial,sans-serif',extra=''){return `<text x="${x}" y="${y}" fill="${color}" font-family="${font}" font-size="${size}" ${extra}>${esc(value)}</text>`;}
function lines(x,y,value,size=30,width=48,color='#c1bdaf',line=1.35){const words=value.split(/\s+/),rows=[''];for(const word of words){let n=rows.length-1;if((rows[n]+' '+word).trim().length>width&&rows[n])rows.push(word);else rows[n]+=(rows[n]?' ':'')+word;}return rows.map((r,i)=>text(x,y+i*size*line,r,size,color)).join('');}
function fp(c,x,y,size){return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 500 500">${fingerprint(c,{dark:true}).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`;}
function band(c,x,y,w,h){let offset=x;return bandSegments(c).map(p=>{const width=w*p.frac,s=`<rect x="${offset}" y="${y}" width="${width}" height="${h}" fill="${p.color}"/>`;offset+=width;return s;}).join('');}
export function socialSVG(format,strain,{farm='Ideal Cannabis',handle='@idealcannabis',other,profileCopy,footer='Historical sample · 2023 · Portfolio demonstration',stat,dropKicker='Drop announcement / example',photo}={}){
 const f=[...FORMATS,PHOTO_FORMAT,PROFILE_FORMAT].find(f=>f.id===format)||FORMATS[0],w=f.size[0],h=f.size[1],c=classify(strain.values),lead=c.ranked[0],blend=blendName(c),serif='Newsreader,Georgia,serif';
 // The headline figure defaults to the historical THC value; uploaded flowers pass their own.
 stat=stat||{value:strain.thc+'%',label:'THC · historical panel',line:strain.thc+'% THC'};
 let a=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(f.title+' for '+strain.name)}"><title>${esc(f.title+' — '+strain.name)}</title><rect width="${w}" height="${h}" fill="#151713"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#6c735a" opacity=".3"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#dots)"/>`;
 a+=brandSVG(68,58,.86)+text(1012,80,farm,19,'#b4b7a6',undefined,'text-anchor="end"');
 if(format==='highlight'){
  a+=text(68,180,'Strain highlight',21,lead.color)+text(68,285,strain.name,90,'#eee9dd',serif)+text(72,337,blend+' / '+c.confidence,25,lead.color);
  a+=band(c,68,408,605,60)+fp(c,720,350,285);
  a+=lines(68,574,strain.aroma,34,42,'#dedaca',1.28);
  a+='<path d="M68 807H1012" stroke="#414837"/>';
  a+=text(68,850,'Leading reported analytes',17,'#a4ab97');
  strain.panel.slice(0,3).forEach((t,i)=>{a+=text(68,891+i*33,`${t[0]}   ${t[1].toFixed(2)}%`,23);});
  a+=text(1012,910,stat.value,64,'#eee9dd',serif,'text-anchor="end"')+text(1012,944,stat.label,18,'#a4ab97',undefined,'text-anchor="end"');
 }else if(format==='drop'){
  a+=text(68,211,dropKicker,24,lead.color)+text(68,389,strain.name,97,'#eee9dd',serif)+text(72,447,blend,30,lead.color);
  a+=lines(72,551,strain.aroma,40,36,'#dedaca',1.4)+fp(c,200,785,680)+band(c,68,1550,944,85);
  a+=text(68,1720,stat.line,58,'#eee9dd',serif)+text(68,1775,'A signature worth getting to know.',30,'#c1bdaf');
 }else if(format==='photo'){
  // Rebuilt from the top: the photograph sits under the brand line, so the shared header is redrawn over a scrim.
  a=a.slice(0,a.indexOf('<rect width="'+w+'" height="'+h+'" fill="url(#dots)"/>'))+`<defs><linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e0e0c" stop-opacity=".72"/><stop offset=".2" stop-color="#0e0e0c" stop-opacity=".08"/><stop offset=".5" stop-color="#0e0e0c" stop-opacity=".12"/><stop offset=".78" stop-color="#0e0e0c" stop-opacity=".9"/><stop offset="1" stop-color="#0e0e0c" stop-opacity=".97"/></linearGradient></defs>`+(photo?`<image href="${esc(photo)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`:'')+`<rect width="${w}" height="${h}" fill="url(#scrim)"/>`+brandSVG(68,58,.86)+text(1012,80,farm,19,'#dedaca',undefined,'text-anchor="end"');
  a+=`<circle cx="872" cy="968" r="150" fill="#151713" opacity=".86"/>`+fp(c,732,828,280);
  a+=text(68,1010,strain.name,strain.name.length>16?72:92,'#eee9dd',serif)+text(72,1064,blend+' / '+c.confidence,27,lead.color)+band(c,68,1120,944,44);
  strain.panel.slice(0,3).forEach((t,i)=>{a+=text(68+i*320,1218,t[0],20,'#c1bdaf')+text(68+i*320,1252,t[1].toFixed(2)+'%',28);});
}else if(format==='profile'){
  const copy=profileCopy||{name:lead.label.split(' / ')[0],pair:lead.label.split(' / ')[1]||'',notes:''},name0=lead.label.split(' / ')[0];
  const r=c.ranked,why=profileWhy(strain,c),notes=(copy.notes||'').replace(/\.$/,'').split('. ').join(', ').toLowerCase();
  a+=text(68,180,'Profile feature · '+strain.name,23,lead.color)+`<rect x="68" y="208" width="944" height="12" fill="${lead.color}"/>`;
  a+=text(68,330,copy.name||name0,118,'#eee9dd',serif)+text(72,388,[copy.pair,notes].filter(Boolean).join(' · '),30,lead.color)+fp(c,742,236,270);
  a+=text(68,472,'Why it lands here',22,'#a4ab97');
  why.forEach(([hd,body],i)=>{const y=518+i*108;a+=text(68,y,hd,30,'#eee9dd',serif)+lines(68,y+36,body,22,66,'#c1bdaf',1.36);});
  a+=text(68,856,'Model score by profile',22,'#a4ab97');
  r.slice(0,5).forEach((p,i)=>{const y=876+i*56,w=Math.max(4,Math.round(560*p.pct/(r[0].pct||1)));a+=text(68,y+28,p.label,24,'#dedaca')+`<rect x="388" y="${y+4}" width="${w}" height="30" rx="3" fill="${p.color}"/>`+text(400+w,y+28,p.pct+'%',24,'#eee9dd');});
  a+=text(68,1196,'Model scores, not measured aroma percentages.',21,'#a4ab97');
 }else if(format==='fingerprint'){
  a+=text(68,200,'Every flower has a signature.',48,'#eee9dd',serif)+fp(c,170,250,740);
  a+=text(540,1040,strain.name,74,'#eee9dd',serif,'text-anchor="middle"')+text(540,1090,blend,27,lead.color,undefined,'text-anchor="middle"')+band(c,68,1160,944,48);
 }else if(format==='spotlight'){
  const copy=profileCopy||{notes:'A distinct aromatic character.',drivers:'See the terpene library.'};
  a+=text(68,182,'Aroma spotlight',21,lead.color)+`<rect x="68" y="221" width="944" height="13" fill="${lead.color}"/>`;
  a+=text(68,345,lead.label.split(' / ')[0],112,'#eee9dd',serif)+text(72,405,lead.label.split(' / ')[1],35,lead.color);
  a+=lines(68,509,copy.notes,42,36,'#dedaca',1.35)+text(68,686,'Associated terpenes',19,'#a4ab97')+lines(68,735,copy.drivers,29,46);
  a+=text(68,902,'Trust your nose.',60,'#eee9dd',serif)+text(68,950,'Meet the profiles behind the flower.',25,'#b4b7a6');
 }else if(format==='compare'){
  const b=other||strain,bc=classify(b.values);
  a+=text(68,184,'Same system. Different flower.',57,'#eee9dd',serif);
  a+=lines(68,235,'A shared visual language makes the differences easier to see.',24,68);
  [[strain,c,68],[b,bc,574]].forEach(([s,sc,x])=>{a+=fp(sc,x+35,280,370)+text(x,695,s.name,44,'#eee9dd',serif)+text(x,739,blendName(sc),23,sc.ranked[0].color)+band(sc,x,777,438,40)+lines(x,868,s.aroma,22,31,'#c1bdaf',1.32);});
 }else{
  a+=text(68,188,'Trust your nose',23,lead.color)+lines(68,337,'The number on the jar is only part of the story.',75,24,'#eee9dd',1.15);
  a+=lines(68,751,'Aroma adds another dimension. A familiar language for a wonderfully complex flower.',31,49,'#c1bdaf',1.4)+band(c,68,914,944,28);
 }
 a+=`<path d="M68 ${h-70}H1012" stroke="#414837"/>`+text(68,h-36,footer,16,'#a4ab97')+text(1012,h-36,handle,17,'#dedaca',undefined,'text-anchor="end"')+'</svg>';
 return a;
}
let fontCache;
export async function embedFonts(svg){
 if(!fontCache)fontCache=Promise.all(['newsreader','dm-sans'].map(async name=>{const r=await fetch(`/assets/fonts/${name}.woff2`);if(!r.ok)throw Error('Font could not load');const bytes=new Uint8Array(await r.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return `@font-face{font-family:'${name==='newsreader'?'Newsreader':'DM Sans'}';src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');font-weight:100 900;}`;})).then(a=>a.join(''));
 return svg.replace('</title>','</title><style>'+await fontCache+'</style>');
}
export function saveFile(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function pngBlob(svg){const embedded=await embedFonts(svg);
 const image=new Image(),url=URL.createObjectURL(new Blob([embedded],{type:'image/svg+xml'}));try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG export failed');return blob;}finally{URL.revokeObjectURL(url);}}
export async function saveSocial(svg,format,name){if(format==='svg'){saveFile(await embedFonts(svg),name+'.svg','image/svg+xml');return;}saveFile(await pngBlob(svg),name+'.png','image/png');}
