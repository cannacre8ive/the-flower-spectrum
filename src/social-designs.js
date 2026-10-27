import {PROFILES,classify,bandSegments,blendName} from './engine.js';
import {fingerprint,escapeXML as esc} from './visuals.js';
export const FORMATS=[
 {id:'highlight',title:'Strain highlight',size:[1080,1080],shape:'1:1 / Feed',role:'Introduce the flower',description:'A signature launch card: strain, aroma identity, leading analytes, and a distinctive fingerprint. A coherent starting point for a farm’s feed.'},
 {id:'drop',title:'Drop announcement',size:[1080,1920],shape:'9:16 / Story',role:'Make the introduction',description:'A full-height story with room for the flower’s character. The same palette and fingerprint make a release recognizable before the reader reaches the farm name.'},
 {id:'spotlight',title:'Aroma spotlight',size:[1080,1080],shape:'1:1 / Education',role:'Give people a reason to care',description:'Explain the leading aroma profile in plain language. Educational content gives the farm a useful voice between product releases.'},
 {id:'fingerprint',title:'Fingerprint ID',size:[1080,1350],shape:'4:5 / Portrait',role:'Build recognition',description:'The visual signature becomes the hero. A portrait format made to let an individual strain’s identity stand on its own.'},
 {id:'compare',title:'Different flower. Different story.',size:[1080,1080],shape:'1:1 / Comparison',role:'Show the difference',description:'Two strains, one visual grammar. The comparison explains why aroma offers a richer conversation than a single potency number.'},
 {id:'voice',title:'Brand voice',size:[1080,1080],shape:'1:1 / Editorial',role:'Express a point of view',description:'A typographic brand statement built from the same system. A moment of perspective that still belongs unmistakably to the farm.'}
];
export function brandSVG(x,y,scale=1){return `<g transform="translate(${x} ${y}) scale(${scale})">${PROFILES.map((p,i)=>`<rect x="${i*8}" y="0" width="8" height="28" fill="${p.color}"/>`).join('')}<text x="96" y="25" fill="#eee9dd" font-family="Newsreader,Georgia,serif" font-size="33" font-weight="600">Flower Spectrum</text></g>`;}
function text(x,y,value,size=30,color='#eee9dd',font='DM Sans,Arial,sans-serif',extra=''){return `<text x="${x}" y="${y}" fill="${color}" font-family="${font}" font-size="${size}" ${extra}>${esc(value)}</text>`;}
function lines(x,y,value,size=30,width=48,color='#c1bdaf',line=1.35){const words=value.split(/\s+/),rows=[''];for(const word of words){let n=rows.length-1;if((rows[n]+' '+word).trim().length>width&&rows[n])rows.push(word);else rows[n]+=(rows[n]?' ':'')+word;}return rows.map((r,i)=>text(x,y+i*size*line,r,size,color)).join('');}
function fp(c,x,y,size){return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 500 500">${fingerprint(c,{dark:true}).replace(/<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>`;}
function band(c,x,y,w,h){let offset=x;return bandSegments(c).map(p=>{const width=w*p.frac,s=`<rect x="${offset}" y="${y}" width="${width}" height="${h}" fill="${p.color}"/>`;offset+=width;return s;}).join('');}
export function socialSVG(format,strain,{farm='Ideal Cannabis',handle='@idealcannabis',other,profileCopy}={}){
 const f=FORMATS.find(f=>f.id===format)||FORMATS[0],w=f.size[0],h=f.size[1],c=classify(strain.values),lead=c.ranked[0],blend=blendName(c),serif='Newsreader,Georgia,serif';
 let a=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(f.title+' for '+strain.name)}"><title>${esc(f.title+' — '+strain.name)}</title><rect width="${w}" height="${h}" fill="#151713"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#6c735a" opacity=".3"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#dots)"/>`;
 a+=brandSVG(68,58,.86)+text(1012,80,farm,19,'#b4b7a6',undefined,'text-anchor="end"');
 if(format==='highlight'){
  a+=text(68,180,'Strain highlight',21,lead.color)+text(68,285,strain.name,90,'#eee9dd',serif)+text(72,337,blend+' / '+c.confidence,25,lead.color);
  a+=band(c,68,408,605,60)+fp(c,720,350,285);
  a+=lines(68,574,strain.aroma,34,42,'#dedaca',1.28);
  a+='<path d="M68 807H1012" stroke="#414837"/>';
  a+=text(68,850,'Leading reported analytes',17,'#a4ab97');
  strain.panel.slice(0,3).forEach((t,i)=>{a+=text(68,891+i*33,`${t[0]}   ${t[1].toFixed(2)}%`,23);});
  a+=text(1012,910,strain.thc+'%',64,'#eee9dd',serif,'text-anchor="end"')+text(1012,944,'THC · historical panel',18,'#a4ab97',undefined,'text-anchor="end"');
 }else if(format==='drop'){
  a+=text(68,211,'Drop announcement / example',24,lead.color)+text(68,389,strain.name,97,'#eee9dd',serif)+text(72,447,blend,30,lead.color);
  a+=lines(72,551,strain.aroma,40,36,'#dedaca',1.4)+fp(c,200,785,680)+band(c,68,1550,944,85);
  a+=text(68,1720,strain.thc+'% THC',58,'#eee9dd',serif)+text(68,1775,'A signature worth getting to know.',30,'#c1bdaf');
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
 a+=`<path d="M68 ${h-70}H1012" stroke="#414837"/>`+text(68,h-36,'Historical sample · 2023 · Portfolio demonstration',14,'#a4ab97')+text(1012,h-36,handle,17,'#c4b275',undefined,'text-anchor="end"')+'</svg>';
 return a;
}
let fontCache;
export async function embedFonts(svg){
 if(!fontCache)fontCache=Promise.all(['newsreader','dm-sans'].map(async name=>{const r=await fetch(`/assets/fonts/${name}.woff2`);if(!r.ok)throw Error('Font could not load');const bytes=new Uint8Array(await r.arrayBuffer());let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return `@font-face{font-family:'${name==='newsreader'?'Newsreader':'DM Sans'}';src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');font-weight:100 900;}`;})).then(a=>a.join(''));
 return svg.replace('</title>','</title><style>'+await fontCache+'</style>');
}
export function saveFile(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function saveSocial(svg,format,name){const embedded=await embedFonts(svg);if(format==='svg'){saveFile(embedded,name+'.svg','image/svg+xml');return;}
 const image=new Image(),url=URL.createObjectURL(new Blob([embedded],{type:'image/svg+xml'}));try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG export failed');saveFile(blob,name+'.png','image/png');}finally{URL.revokeObjectURL(url);}}
