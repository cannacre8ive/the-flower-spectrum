import test from 'node:test';
import assert from 'node:assert/strict';
import {TERPENES} from '../src/education-data.js';
import {STRAINS,PROFILES} from '../src/engine.js';
import {FORMATS,socialSVG} from '../src/social-designs.js';
import {buyerDocument} from '../src/buyer-sheet.js';
test('education library includes all 38 unique source cards and valid associations',()=>{assert.equal(TERPENES.length,38);assert.equal(new Set(TERPENES.map(t=>t.key)).size,38);for(const t of TERPENES){assert.ok(t.aroma&&t.impact&&t.foundWith.length);assert.ok(PROFILES.some(p=>p.key===t.profile));}});
test('six social formats render all three samples at correct native dimensions',()=>{assert.equal(FORMATS.length,6);for(const f of FORMATS)for(const s of STRAINS){const svg=socialSVG(f.id,s,{farm:'<Farm & Sons>',handle:'@farm',other:STRAINS.find(x=>x.id!==s.id)});assert.ok(svg.includes(`width="${f.size[0]}" height="${f.size[1]}"`));assert.ok(svg.includes('&lt;Farm &amp; Sons&gt;'));assert.ok(svg.includes('Historical sample'));assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('Validated COA'));}});
test('buyer exports preserve all reported analytes and missing commercial data',()=>{for(const s of STRAINS){const html=buyerDocument(s,'Test <Farm>');assert.ok(html.includes('Test &lt;Farm&gt;'));assert.ok(html.includes(s.sample));assert.ok(html.includes(s.lot));assert.equal((html.match(/<th scope="row">/g)||[]).length,s.panel.length);for(const [name,v]of s.panel){assert.ok(html.includes(name));assert.ok(html.includes(v.toFixed(2)+'%'));}assert.ok(html.includes('Not supplied'));assert.ok(html.includes('details class="sheet-disclosure chemistry-panel" open'));}});
