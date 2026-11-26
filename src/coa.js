// Lab-report ingestion, ported from the Flower Spectrum COA classifier (importer v1.1).
// Analyte names are matched through an explicit alias table. Nothing is fuzzy-guessed:
// a name that is not recognised is surfaced for review, never silently assigned.
import {TERPENES as LIBRARY} from './education-data.js';

export const LABELS=Object.fromEntries(LIBRARY.map(t=>[t.key,t.label]));
export function canon(s){
 return (s||'').toString().toLowerCase()
  .replace(/α/g,'alpha').replace(/β/g,'beta').replace(/γ/g,'gamma')
  .replace(/δ/g,'delta').replace(/Δ/g,'delta').replace(/ρ/g,'rho')
  .replace(/[^a-z0-9]/g,'');
}
const ALIASES=[
 ['myrcene',['myrcene','β-myrcene','beta-myrcene']],
 ['limonene',['limonene','d-limonene','δ-limonene','dl-limonene','(d)-limonene','r-limonene','(r)-(+)-limonene']],
 ['caryophyllene',['caryophyllene','β-caryophyllene','beta-caryophyllene','trans-caryophyllene','(e)-caryophyllene','trans-β-caryophyllene','b-caryophyllene','beta caryophyllene']],
 ['linalool',['linalool','linalol','β-linalool']],
 ['pinene_a',['α-pinene','alpha-pinene','a-pinene','(+)-α-pinene','(1r)-(+)-α-pinene','alpha pinene']],
 ['pinene_b',['β-pinene','beta-pinene','b-pinene','(-)-β-pinene','beta pinene']],
 ['terpinolene',['terpinolene']],
 ['humulene',['α-humulene','alpha-humulene','humulene','α-caryophyllene','alpha-caryophyllene','alpha humulene']],
 ['ocimene',['β-ocimene','beta-ocimene','ocimene','(e)-ocimene','(z)-ocimene','cis-ocimene','trans-ocimene','ocimene 1','ocimene 2','ocimene-1','ocimene-2','(e)-β-ocimene','beta-ocimene 1','beta-ocimene 2','cis-β-ocimene','trans-β-ocimene']],
 ['bisabolol',['α-bisabolol','alpha-bisabolol','bisabolol','(-)-α-bisabolol','levomenol','alpha bisabolol']],
 ['valencene',['valencene','(+)-valencene']],
 ['nerolidol',['trans-nerolidol','nerolidol','cis-nerolidol','(e)-nerolidol','(z)-nerolidol','nerolidol 1','nerolidol 2','nerolidol-1','nerolidol-2','trans-β-nerolidol']],
 ['guaiol',['guaiol']],
 ['terpineol',['α-terpineol','alpha-terpineol','terpineol','alpha terpineol']],
 ['caryophyllene_oxide',['caryophyllene oxide','caryophyllene-oxide','β-caryophyllene oxide','caryophylleneoxide']],
 ['farnesene_b',['β-farnesene','beta-farnesene','(e)-β-farnesene','trans-β-farnesene','cis-β-farnesene']],
 ['farnesene_a',['α-farnesene','alpha-farnesene','farnesene','(e,e)-α-farnesene']],
 ['camphene',['camphene']],
 ['carene',['δ-3-carene','delta-3-carene','3-carene','carene','δ-carene','d-3-carene','(+)-3-carene','delta3carene']],
 ['geraniol',['geraniol']],
 ['fenchol',['fenchol','fenchyl alcohol','endo-fenchyl alcohol','(-)-fenchol','endo-fenchol','(+)-fenchol','fenchyl-alcohol']],
 ['borneol',['borneol','(-)-borneol','(+)-borneol','l-borneol']],
 ['sabinene',['sabinene']],
 ['pcymene',['p-cymene','para-cymene','cymene','ρ-cymene','4-cymene','p cymene']],
 ['eucalyptol',['eucalyptol','1,8-cineole','cineole','1,8-cineol','eucalyptol (1,8-cineole)','1 8-cineole']],
 ['citronellol',['citronellol','β-citronellol']],
 ['nerol',['nerol']],
 ['isopulegol',['isopulegol']],
 ['pulegone',['pulegone','(r)-(+)-pulegone']],
 ['menthol',['menthol','l-menthol','(-)-menthol']],
 ['cedrene',['α-cedrene','alpha-cedrene','cedrene']],
 ['bergamotene',['α-bergamotene','alpha-bergamotene','bergamotene','trans-α-bergamotene','(e)-α-bergamotene']],
 ['gterpinene',['γ-terpinene','gamma-terpinene','g-terpinene','gamma terpinene']],
 ['sabinene_hydrate',['sabinene hydrate','cis-sabinene hydrate','trans-sabinene hydrate','sabinene-hydrate']],
 ['phytol',['phytol','trans-phytol']],
 ['phellandrene',['α-phellandrene','alpha-phellandrene','phellandrene']],
 ['aterpinene',['α-terpinene','alpha-terpinene','alpha terpinene']],
 ['geranyl_acetate',['geranyl acetate','geranyl-acetate','geranylacetate']],
];
export const LOOKUP={};
ALIASES.forEach(([key,list])=>list.forEach(a=>{LOOKUP[canon(a)]=key;}));
LIBRARY.forEach(t=>{LOOKUP[canon(t.label)]=t.key;LOOKUP[canon(t.key)]=t.key;});
const AMBIGUOUS={
 [canon('terpinene')]:'ambiguous: α-terpinene or γ-terpinene',
 [canon('pinene')]:'ambiguous: α-pinene or β-pinene',
 [canon('nerolidol total')]:'isomer total: individual nerolidol peaks are counted instead',
};
function cannabinoidKind(cn){
 if(/^totalthc$/.test(cn))return 'total_thc';
 if(/^(delta9thc|d9thc|thc)$/.test(cn))return 'thc';
 if(/^thca$/.test(cn))return 'thca';
 if(/^cbda$/.test(cn))return 'cbda';
 if(/^(cbd|totalcbd)$/.test(cn))return 'cbd';
 if(/^(totalcannabinoids|cannabinoidtotal)$/.test(cn))return 'total_cannabinoids';
 if(/(thcv|cbga?$|cbn$|cbc$|cbdv|delta8thc|d8thc|cannabinoids)/.test(cn))return 'other_cannabinoid';
 return null;
}
const tokenizeRow=line=>line.split(/\t+|\s{2,}/).map(x=>x.trim()).filter(x=>x!=='');
const NAME_HDR=/^(analyte|compound|terpene|terpenes?|name|constituent)s?$/i,VAL_HDR=/(result|conc|concentration|amount|%|percent|wt|mg\s*\/\s*g)/i;
const NOT_DETECTED=/(nd|n\/d|<\s*loq|<\s*lod|<\s*loc|blq|bdl|not\s*detected|none\s*detected)/i;
function detectHeader(line){
 const t=tokenizeRow(line);if(t.length<2)return null;
 if(!t.some(x=>NAME_HDR.test(x)||/(result|conc|concentration|amount)/i.test(x)))return null;
 let nameIdx=t.findIndex(x=>NAME_HDR.test(x));if(nameIdx<0)nameIdx=0;
 let pct=-1,mgg=-1,gen=-1;
 t.forEach((x,i)=>{if(i===nameIdx)return;
  if(/mg\s*\/\s*g/i.test(x))mgg=mgg<0?i:mgg;
  else if(/%|percent|wt/i.test(x))pct=pct<0?i:pct;
  else if(/result|conc|concentration|amount/i.test(x))gen=gen<0?i:gen;});
 let valIdx,unit='%';
 if(pct>=0)valIdx=pct;else if(gen>=0)valIdx=gen;else if(mgg>=0){valIdx=mgg;unit='mg/g';}else return null;
 if(!t.some(x=>VAL_HDR.test(x)))return null;
 return {nameIdx,valIdx,unit};
}
export function numFrom(cell){
 if(cell==null)return null;
 if(NOT_DETECTED.test(cell)&&!/[0-9]/.test(cell.replace(/loq|lod|loc/ig,'')))return 0;
 const m=String(cell).match(/-?[0-9]*\.?[0-9]+/);return m?parseFloat(m[0]):null;
}
function splitNameValue(line){
 const s=line.replace(/^[\s•‣▪\-|]+/,'').trim();if(!s)return null;
 const ok=(name,value,guess,unit)=>{name=name.replace(/[\s,:;\-]+$/,'').replace(/^[\s,:;\-]+/,'').trim();if(!name||!/[a-zA-Z]/.test(name)||value===null||isNaN(value))return null;return {name,value,guess:!!guess,unit:unit||'%'};};
 let m=s.match(/^(.*?[a-zA-Z].*?)\s*[:,;]?\s*([0-9]*\.?[0-9]+)\s*%/);if(m)return ok(m[1],parseFloat(m[2]),false);
 m=s.match(/^(.*?[a-zA-Z].*?)\s*[:,;]?\s*([0-9]*\.?[0-9]+)\s*mg\s*\/\s*g/i);if(m)return ok(m[1],parseFloat(m[2])/10,false,'mg/g');
 if(/[a-zA-Z]/.test(s)&&NOT_DETECTED.test(s)){
  const stripped=s.replace(new RegExp(NOT_DETECTED.source,'ig'),'');
  if(!/[0-9]/.test(stripped))return ok(s.replace(new RegExp('[\\s,:;\\-]*'+NOT_DETECTED.source+'.*$','i'),''),0,false);
 }
 const nums=[...s.matchAll(/[0-9]*\.?[0-9]+/g)];if(!nums.length)return null;
 let tail=nums.length-1;
 for(let i=0;i<nums.length;i++){if(/^[0-9]*\.?[0-9]+([\s,;%]|mg\s*\/\s*g|[0-9.])*$/i.test(s.slice(nums[i].index))){tail=i;break;}}
 const values=nums.slice(tail).map(x=>parseFloat(x[0]));
 return ok(s.slice(0,nums[tail].index),values[values.length-1],values.length>1);
}
export function parseCOA(text){
 const values={},matched=[],unmapped=[],meta={lot:'',sample:'',harvest:'',grower:'',product:''};
 let thc=null,thca=null,totalThc=null,cbd=null,cbda=null,totalCannabinoids=null,reportedTotal=null,header=null;
 const add=(rawName,value,unit,guess)=>{
  if(value===null||isNaN(value))return;
  if(/^total\s*terp/i.test(rawName)){reportedTotal=value;return;}
  const cn=canon(rawName);if(!cn)return;
  const kind=cannabinoidKind(cn);
  if(kind){if(kind==='total_thc')totalThc=value;else if(kind==='thc')thc=value;else if(kind==='thca')thca=value;else if(kind==='cbda')cbda=value;else if(kind==='cbd')cbd=value;else if(kind==='total_cannabinoids')totalCannabinoids=value;return;}
  if(AMBIGUOUS[cn]){unmapped.push({raw:rawName,value,reason:AMBIGUOUS[cn]});return;}
  const key=LOOKUP[cn];
  if(!key){unmapped.push({raw:rawName,value,reason:'not a tracked terpene'});return;}
  if(value>0){const summed=values[key]!=null;values[key]=+((values[key]||0)+value).toFixed(4);matched.push({raw:rawName,key,label:LABELS[key],value,unit:unit||'%',summed,guess:!!guess});}
 };
 for(const raw of (text||'').split(/\r?\n/)){
  const line=raw.trim();if(!line||/^#/.test(line))continue;
  const admin=line.match(/^(sample(?:\s*id)?|lot|batch|harvest(?:\s*date)?|producer|cultivator|grower|farm|product|strain)\s*[:#\-]\s*(.+)$/i);
  if(admin){const k=admin[1].toLowerCase(),v=admin[2].trim();
   if(/^sample/.test(k))meta.sample=v;else if(/^(lot|batch)/.test(k))meta.lot=v;else if(/^harvest/.test(k))meta.harvest=v;else if(/^(producer|cultivator|grower|farm)/.test(k))meta.grower=v;else meta.product=v;continue;}
  if(/^(sample|product|lot|batch|report|certificate|license|harvest|tested|received|issued|method|instrument|page|address)\s*[:#\-]/i.test(line))continue;
  const h=detectHeader(line);if(h){header=h;continue;}
  if(header){
   const t=tokenizeRow(line);
   if(t.length>=2&&t.length>=header.valIdx+1&&/[a-zA-Z]/.test(t[header.nameIdx]||'')){
    let value=numFrom(t[header.valIdx]);
    if(value===null)for(let i=header.nameIdx+1;i<t.length;i++){const n=numFrom(t[i]);if(n!==null){value=n;break;}}
    if(value!==null){add(t[header.nameIdx],header.unit==='mg/g'?value/10:value,header.unit,false);continue;}
   }
  }
  const pair=splitNameValue(line);if(pair)add(pair.name,pair.value,pair.unit,pair.guess);
 }
 let thcOut=null;
 if(totalThc!=null)thcOut=totalThc;else if(thc!=null||thca!=null)thcOut=+(((thc||0)+0.877*(thca||0)).toFixed(2));
 const cbdOut=(cbd!=null||cbda!=null)?+(((cbd||0)+0.877*(cbda||0)).toFixed(2)):null;
 return {values,matched,unmapped,thc:thcOut,cbd:cbdOut,totalCannabinoids,meta,reportedTotal};
}

// PDF text items carry x/y positions. Rows are rebuilt by position so two-column tables survive.
export function pdfItemsToLines(items){
 const rows=[];
 (items||[]).forEach(item=>{
  const str=String(item.str||'').trim();if(!str)return;
  const x=Number(item.transform&&item.transform[4])||0,y=Number(item.transform&&item.transform[5])||0;
  let row=rows.find(r=>Math.abs(r.y-y)<=2.5);if(!row){row={y,items:[]};rows.push(row);}
  row.items.push({str,x,width:Number(item.width)||0});
 });
 return rows.sort((a,b)=>b.y-a.y).map(row=>{
  let line='',cursor=null;
  row.items.sort((a,b)=>a.x-b.x).forEach(cell=>{
   if(cursor!=null){const gap=cell.x-cursor,avg=Math.max(2,cell.width/Math.max(cell.str.length,1));line+=gap>Math.max(9,avg*2.2)?'\t':' ';}
   line+=cell.str;cursor=cell.x+cell.width;
  });
  return line.trim();
 }).filter(Boolean).join('\n');
}
function columnLines(items,width,side){
 const mid=width/2;
 return pdfItemsToLines((items||[]).filter(item=>{const x=Number(item.transform&&item.transform[4])||0;return side==='left'?x<mid:x>=mid;}));
}
function cellsOf(line){return line.split(/\t+/).map(x=>x.trim()).filter(Boolean);}
export function pdfTerpeneRows(items,width){
 const read=sides=>{
  const out=[];
  sides.forEach(side=>(side==='full'?pdfItemsToLines(items):columnLines(items,width,side)).split(/\r?\n/).forEach(line=>{
   const cells=cellsOf(line);if(cells.length<2)return;
   const rawName=cells[0].replace(/^[-–—•\s]+/,'').trim(),cn=canon(rawName);
   if(!LOOKUP[cn]&&!AMBIGUOUS[cn])return;
   // A percent column is preferred when a row labels one; otherwise the first value after the name.
   const pct=cells.slice(1).find(c=>/%/.test(c)&&numFrom(c)!=null),value=numFrom(pct||cells[1]);
   if(value!=null&&value>0)out.push(rawName+'\t'+value+' %');
  }));
  return out;
 };
 const split=read(['left','right']),full=read(['full']);
 return full.length>split.length?full:split;
}
function pdfCannabinoidRows(items,width){
 const lines=[];
 ['left','right'].forEach(side=>columnLines(items,width,side).split(/\r?\n/).forEach(line=>{
  const cells=cellsOf(line);if(cells.length<2)return;
  const raw=cells[0].trim(),rc=canon(raw),kind=rc==='total'?'total':cannabinoidKind(rc);if(!kind)return;
  const nums=cells.slice(1).flatMap(c=>[...c.matchAll(/[0-9]*\.?[0-9]+/g)].map(m=>parseFloat(m[0])));
  // "CBD  0.4  <LOQ  <LOQ" holds a reporting limit, not a result.
  const limited=cells.slice(1).some(c=>/<\s*LOQ|ND|N\/D/i.test(c));
  const value=limited?0:nums.length>=3?nums[1]:nums.length?nums[0]:null;
  if(value!=null)lines.push((rc==='total'?'Total Cannabinoids':raw)+'\t'+value+' %');
 }));
 return lines;
}
function adminLines(text){
 const one=re=>{const m=String(text||'').match(re);return m?m[1].trim():'';};
 const strain=one(/(?:Strain|Cultivar|Product Name|Sample Name)\s*:\s*([^\n;\t]+)/i),sample=one(/Sample(?:\s*ID)?\s*[:#]\s*([^\s;]+)/i),harvest=one(/Harvest(?:\/Production)?\s*Date\s*:\s*([0-9/.\-]+)/i),lot=one(/(?:Harvest Process Lot|Lot(?:\s*(?:#|No\.?|Number))?|Batch(?:\s*(?:#|No\.?|Number))?)\s*:\s*([^;\n\t]+)/i);
 return [strain&&'Strain: '+strain,sample&&'Sample: '+sample,harvest&&'Harvest: '+harvest,lot&&'Lot: '+lot].filter(Boolean);
}
function totalTerpeneLine(text){
 const n=String(text||'').replace(/\s+/g,' ');
 const m=n.match(/([0-9]*\.?[0-9]+)\s*%\s*Total Terpenes/i)||n.match(/Total Terpenes\s*:?\s*([0-9]*\.?[0-9]+)\s*%/i);
 return m?'Total Terpenes\t'+m[1]+' %':'';
}
// pages: [{items,width}] in document order. Returns the reconstructed text and the page it came from.
export function extractFromPages(pages){
 const scored=pages.map((p,i)=>{const full=pdfItemsToLines(p.items),rows=pdfTerpeneRows(p.items,p.width);
  return {page:i+1,items:p.items,width:p.width,full,rows,score:rows.length*8+(/\bTerpenes?\b/i.test(full)?20:0)+(/Total Terpenes/i.test(full)?15:0)+(/mg\s*\/\s*g/i.test(full)?3:0)};});
 const best=scored.slice().sort((a,b)=>b.score-a.score)[0],all=scored.map(p=>p.full).join('\n\n');
 if(!best||best.rows.length<2)return {text:all,page:null,textLength:all.replace(/\s/g,'').length};
 const total=totalTerpeneLine(best.full);
 const text=[...adminLines(all),...pdfCannabinoidRows(scored[0].items,scored[0].width),...best.rows,...(total?[total]:[])].join('\n');
 return {text,page:best.page,textLength:all.replace(/\s/g,'').length};
}
