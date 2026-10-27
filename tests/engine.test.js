import test from 'node:test';
import assert from 'node:assert/strict';
import {PROFILES,STRAINS,classify,bandSegments,blendName} from '../src/engine.js';
import {fingerprint,illustrativeProfile,exportArtwork} from '../src/visuals.js';
test('historical sample identities match the supplied prototype',()=>{
 assert.deepEqual(STRAINS.map(s=>blendName(classify(s.values))),['Earth-Spicy','Citrus-Floral','Citrus-Floral']);
});
test('zero input is unclassified and creates no segments',()=>{
 assert.equal(classify({}),null);assert.equal(classify({limonene:0}),null);assert.deepEqual(bandSegments(null),[]);
});
test('a pure limonene input leads with citrus and a single strip segment',()=>{
 const c=classify({limonene:1});assert.equal(c.ranked[0].key,'citrus_bright');assert.equal(bandSegments(c).length,1);assert.equal(bandSegments(c)[0].frac,1);
});
test('historical and random finite blends have bounded proportional strips',()=>{
 let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 const panels=[...STRAINS.map(s=>s.values),...Array.from({length:100},()=>({myrcene:rand(),limonene:rand(),linalool:rand(),caryophyllene:rand()}))];
 for(const panel of panels){const c=classify(panel),s=bandSegments(c);assert.ok(s.length>0&&s.length<=3);assert.ok(Math.abs(s.reduce((a,p)=>a+p.frac,0)-1)<1e-12);assert.ok(s.every(p=>p.pct>=c.ranked[0].pct*.6));assert.equal(c.ranked.length,10);}
});
test('all ten reference signatures retain the intended leader',()=>{
 PROFILES.forEach((p,i)=>{const c=illustrativeProfile(i);assert.equal(c.ranked[0].key,p.key);assert.equal(c.ranked.reduce((a,p)=>a+p.pct,0),100);assert.ok(fingerprint(c).includes(p.color));});
});
test('every SVG format is portable and escapes custom labels',()=>{
 for(const view of ['fingerprint','strip','card']){const s=exportArtwork(classify(STRAINS[0].values),{view,name:'A < B & C',status:'Illustrative blend'});assert.ok(s.startsWith('<svg xmlns='));assert.ok(s.includes('A &lt; B &amp; C'));assert.ok(s.includes('Illustrative blend'));assert.ok(!s.includes('http://localhost'));assert.ok(!s.includes('NaN'));}
});
