import test from 'node:test';
import assert from 'node:assert/strict';
import {TERPENES,STRAINS,classify,blendName} from '../src/engine.js';
import {TERPENES as LIBRARY} from '../src/education-data.js';
import {parseCOA,pdfItemsToLines,extractFromPages,LOOKUP,canon} from '../src/coa.js';
import {LABELS,labelSVG,spectrumCode} from '../src/labels.js';
import {socialSVG,PHOTO_FORMAT} from '../src/social-designs.js';
const flowerOf=(values,name)=>{const c=classify(values),panel=Object.entries(values).sort((a,b)=>b[1]-a[1]);return {name,values,c,panel,totalTerp:panel.reduce((a,p)=>a+p[1],0)};};
test('the engine models every terpene in the library with matching parameters',()=>{
 assert.equal(TERPENES.length,38);
 for(const t of LIBRARY){const e=TERPENES.find(x=>x.key===t.key);assert.ok(e,t.key);assert.equal(e.profile,t.profile);assert.deepEqual(e.also||[],t.also||[]);assert.equal(e.potency??null,t.potency??null);assert.ok(LOOKUP[canon(t.label)]);}
});
test('a table with LOD and LOQ columns reads the result column, not a detection limit',()=>{
 const r=parseCOA(['# fixture','Analyte              LOD      LOQ      Result (%)','β-Caryophyllene      0.003    0.010    0.740','D-Limonene           0.003    0.010    0.610','(E)-β-Ocimene        0.003    0.010    0.090','1,8-Cineole          0.003    0.010    0.050','Total Terpenes                         3.040'].join('\n'));
 assert.deepEqual(r.values,{caryophyllene:.74,limonene:.61,ocimene:.09,eucalyptol:.05});assert.equal(r.reportedTotal,3.04);assert.equal(r.unmapped.length,0);
});
test('isomers are summed, non-detects dropped, unknown and ambiguous analytes surfaced',()=>{
 const r=parseCOA('β-Farnesene 0.43 %\ncis-β-Farnesene 0.99 %\nLinalool ND\nAnisole 0.27 %\nTerpinene 0.10 %\nα-Pinene 1.4 mg/g\nTHCa 31.3 %\nΔ9-THC 1.52 %\nStrain: Test Flower');
 assert.equal(r.values.farnesene_b,1.42);assert.equal(r.values.linalool,undefined);assert.ok(Math.abs(r.values.pinene_a-.14)<1e-9);
 assert.deepEqual(r.unmapped.map(u=>u.raw),['Anisole','Terpinene']);assert.equal(r.thc,28.97);assert.equal(r.meta.product,'Test Flower');
});
test('a report without a terpene panel yields no values',()=>{assert.deepEqual(parseCOA('THCa 24.1 %\nCBD ND\nMoisture 11.2 %').values,{});});
test('two-column PDF tables are rebuilt by position and the terpene page is chosen',()=>{
 const item=(str,x,y)=>({str,transform:[1,0,0,1,x,y],width:str.length*5});
 const cover=[item('Certificate of Analysis',40,700),item('Strain: Lemon Test',40,680)];
 const panel=[item('Terpenes',40,700),item('δ-Limonene',40,650),item('0.87 %',200,650),item('Linalool',320,650),item('0.44 %',480,650),item('β-Myrcene',40,630),item('0.14 %',200,630),item('β-Caryophyllene',320,630),item('0.31 %',480,630),item('4.06 % Total Terpenes',40,600)];
 assert.ok(pdfItemsToLines(panel).includes('δ-Limonene\t0.87 %'));
 const found=extractFromPages([{items:cover,width:612},{items:panel,width:612}]),r=parseCOA(found.text);
 assert.equal(found.page,2);assert.deepEqual(r.values,{limonene:.87,myrcene:.14,linalool:.44,caryophyllene:.31});assert.equal(r.meta.product,'Lemon Test');
 assert.equal(extractFromPages([{items:cover,width:612}]).page,null);
});
test('PDF tables use the header to find the result column and convert mg/g',()=>{
 const item=(str,x,y)=>({str,transform:[1,0,0,1,x,y],width:str.length*5});
 const row=(y,...cells)=>cells.map((c,i)=>item(c,40+i*110,y));
 const read=items=>parseCOA(extractFromPages([{items,width:612}]).text).values;
 // The percent sign appears only in the header; LOD and LOQ come first.
 assert.deepEqual(read([item('Terpenes',40,700),...row(670,'Analyte','LOD','LOQ','Result (%)'),...row(650,'Limonene','0.003','0.010','0.870'),...row(630,'Linalool','0.003','0.010','0.440')]),{limonene:.87,linalool:.44});
 assert.deepEqual(read([item('Terpenes',40,700),...row(670,'Analyte','LOQ','Result (mg/g)'),...row(650,'Limonene','0.2','8.7'),...row(630,'Linalool','0.2','4.4')]),{limonene:.87,linalool:.44});
 // Units printed on their own row beneath the column names.
 assert.deepEqual(read([item('Terpenes',40,700),...row(670,'Analyte','LOQ','Mass','Mass'),...[['%',150],['mg/g',260],['%',370]].map(([u,x])=>item(u,x,655)),...row(640,'Limonene','0.02','8.7','0.87'),...row(620,'Linalool','0.02','4.4','0.44')]),{limonene:.87,linalool:.44});
 // A non-detect in the result column is not replaced by the reporting limit beside it.
 assert.deepEqual(read([item('Terpenes',40,700),...row(670,'Analyte','LOQ','Result (%)'),...row(650,'Limonene','0.02','0.87'),...row(630,'Linalool','0.02','0.44'),...row(610,'Myrcene','0.02','<LOQ')]),{limonene:.87,linalool:.44});
});
test('the Spectrum ID code is ten digits with the leader at 9',()=>{
 for(const s of STRAINS){const c=classify(s.values),code=spectrumCode(c);assert.match(code,/^FS·\d{10}$/);assert.ok(code.includes('9'));}
 assert.equal(spectrumCode(classify({limonene:1})).slice(3)[2],'9');
});
test('every label renders at print size, escapes names and carries no NaN',()=>{
 const f=flowerOf({limonene:.87,linalool:.44,caryophyllene:.31},'A < B & C');
 for(const l of LABELS)for(const dark of [false,true]){const svg=labelSVG(l.id,f,{farm:'<Farm>',dark});assert.ok(svg.includes(`width="${l.size[0]}" height="${l.size[1]}"`));assert.ok(svg.includes('A &lt; B &amp; C'));assert.ok(!svg.includes('NaN'));assert.ok(svg.includes(blendName(f.c)));}
});
test('social designs accept an uploaded flower without historical wording',()=>{
 const strain={name:'Lemon Test',values:{limonene:.87,linalool:.44,caryophyllene:.31},aroma:'Citrus-forward.',panel:[['D-Limonene',.87],['Linalool',.44],['β-Caryophyllene',.31]],thc:null};
 const options={farm:'Farm',handle:'@farm',footer:'From the lab report',stat:{value:'1.62%',label:'total terpenes',line:'1.62% terpenes'},dropKicker:'New drop',photo:'data:image/jpeg;base64,AAAA'};
 for(const id of ['highlight','drop','spotlight','fingerprint','voice','photo']){const svg=socialSVG(id,strain,options);assert.ok(!svg.includes('Historical'));assert.ok(!svg.includes('null'));assert.ok(!svg.includes('NaN'));assert.ok(svg.includes('From the lab report'));}
 const photo=socialSVG('photo',strain,options);assert.ok(photo.includes(`width="${PHOTO_FORMAT.size[0]}" height="${PHOTO_FORMAT.size[1]}"`));assert.ok(photo.includes('<image href="data:image/jpeg'));
});
test('the Grape Diamonds example reads cleanly and renders the profile feature',async()=>{
 const {readFileSync}=await import('node:fs');const {PROFILE_FORMAT}=await import('../src/social-designs.js');
 const r=parseCOA(readFileSync(new URL('../public/assets/demo/grape-diamonds-terpenes.txt',import.meta.url),'utf8'));
 assert.equal(Object.keys(r.values).length,12);assert.equal(r.unmapped.length,0);assert.equal(r.reportedTotal,2.17);assert.equal(r.thc,17.96);assert.equal(r.meta.product,'Grape Diamonds');
 const total=Object.values(r.values).reduce((a,b)=>a+b,0);assert.ok(Math.abs(total-2.17)<1e-9);
 const flower=flowerOf(r.values,'Grape Diamonds'),c=flower.c;assert.equal(c.ranked[0].key,'earthy_dank');assert.equal(c.confidence,'Leaning');
 const svg=socialSVG('profile',flower,{farm:'Ideal Cannabis',handle:'@idealcannabis',footer:'From the lab report · Aroma model, not an effects claim'});
 assert.ok(svg.includes(`width="${PROFILE_FORMAT.size[0]}" height="${PROFILE_FORMAT.size[1]}"`));assert.ok(svg.includes('Why it lands here'));assert.ok(svg.includes('A confident lean'));assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('undefined'));
});
