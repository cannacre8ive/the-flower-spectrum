const PROFILES=[
  {key:"gas_fuel",      label:"Gas / Fuel",      color:"#C9A84C", short:"GAS"},
  {key:"earthy_dank",   label:"Earthy / Dank",   color:"#6B8E5A", short:"EARTH"},
  {key:"citrus_bright", label:"Citrus / Bright", color:"#D4A843", short:"CITRUS"},
  {key:"fruity_sweet",  label:"Fruity / Sweet",  color:"#B75F4A", short:"FRUIT"},
  {key:"floral_soft",   label:"Floral / Soft",   color:"#B98BBE", short:"FLORAL"},
  {key:"dessert_creamy",label:"Dessert / Creamy",color:"#D6B58A", short:"DESSERT"},
  {key:"spicy_warm",    label:"Spicy / Warm",    color:"#9E6B4A", short:"SPICY"},
  {key:"piney_fresh",   label:"Piney / Fresh",   color:"#4F7A5B", short:"PINE"},
  {key:"herbal_woody",  label:"Herbal / Woody",  color:"#7FA688", short:"HERB"},
  {key:"tropical_tangy",label:"Tropical / Tangy",color:"#D28B49", short:"TROPIC"},
];
const PBK=Object.fromEntries(PROFILES.map(p=>[p.key,p]));
const shortOf=k=>PBK[k]?.short||k;
const TERPENES=[
  {key:"myrcene",profile:"earthy_dank",also:["gas_fuel","herbal_woody"],tier:"primary"},
  {key:"limonene",profile:"citrus_bright",also:["fruity_sweet","gas_fuel"],tier:"primary"},
  {key:"caryophyllene",profile:"spicy_warm",also:["gas_fuel"],potency:1.15,tier:"primary"},
  {key:"linalool",profile:"floral_soft",also:["dessert_creamy"],potency:1.2,tier:"primary"},
  {key:"pinene_a",profile:"piney_fresh",also:["herbal_woody"],tier:"primary"},
  {key:"pinene_b",profile:"piney_fresh",also:["herbal_woody"],tier:"primary"},
  {key:"terpinolene",profile:"fruity_sweet",also:["tropical_tangy","piney_fresh"],tier:"primary"},
  {key:"humulene",profile:"herbal_woody",also:["spicy_warm","earthy_dank","gas_fuel"],tier:"primary"},
  {key:"ocimene",profile:"tropical_tangy",also:["fruity_sweet","floral_soft"],tier:"primary"},
  {key:"bisabolol",profile:"floral_soft",also:["dessert_creamy"],potency:1.2,tier:"impact"},
  {key:"valencene",profile:"citrus_bright",also:["tropical_tangy"],potency:1.2,tier:"impact"},
  {key:"nerolidol",profile:"floral_soft",also:["herbal_woody"],potency:1.15,tier:"impact"},
  {key:"terpineol",profile:"floral_soft",also:["piney_fresh"],tier:"impact"},
  {key:"farnesene_b",profile:"fruity_sweet",also:["herbal_woody"],potency:0.3,tier:"impact"},
  {key:"farnesene_a",profile:"fruity_sweet",also:["herbal_woody"],potency:0.3,tier:"impact"},
  {key:"camphene",profile:"piney_fresh",also:["herbal_woody"],tier:"impact"},
  {key:"fenchol",profile:"herbal_woody",also:["piney_fresh"],tier:"impact"},
  {key:"geranyl_acetate",profile:"floral_soft",also:["fruity_sweet"],tier:"trace"},
  {key:"phytol",profile:"herbal_woody",tier:"trace"},
];
const TBK=Object.fromEntries(TERPENES.map(t=>[t.key,t]));
const POT_DEF={primary:1.0,impact:1.1,trace:0.7};
const potOf=t=>(t.potency!=null?t.potency:POT_DEF[t.tier]);
function contribOf(t){const c={};c[t.profile]=0.7;(t.also||[]).forEach((p,i)=>{c[p]=i===0?0.2:0.1;});const s=Object.values(c).reduce((a,b)=>a+b,0);Object.keys(c).forEach(k=>c[k]=c[k]/s);return c;}
function classify(values){
  const scores={};PROFILES.forEach(p=>scores[p.key]=0);
  TERPENES.forEach(t=>{const v=values[t.key]||0;if(v<=0)return;const w=v*potOf(t),c=contribOf(t);Object.entries(c).forEach(([pk,ww])=>{scores[pk]+=w*ww;});});
  const car=(values.caryophyllene||0)*potOf(TBK.caryophyllene);
  const lim=(values.limonene||0)*potOf(TBK.limonene);
  const mus=(values.myrcene||0)*potOf(TBK.myrcene)+(values.humulene||0)*potOf(TBK.humulene);
  if(car>0&&lim>0&&mus>0){const mn=Math.min(car,lim,mus),mx=Math.max(car,lim,mus);scores.gas_fuel+=1.5*mn*Math.pow(mn/mx,1.5);}
  const total=Object.values(scores).reduce((a,b)=>a+b,0);
  if(total===0)return null;
  const ranked=PROFILES.map(p=>({...p,pct:Math.round((scores[p.key]/total)*100)})).sort((a,b)=>b.pct-a.pct);
  const gap=ranked[0].pct-ranked[1].pct;
  const confidence=gap>=22?"Defined":gap>=10?"Leaning":"Blend";
  const totalTerp=TERPENES.reduce((s,t)=>s+(values[t.key]||0),0);
  return {ranked,confidence,gap,totalTerp};
}
function bandSegments(c){
  if(!c)return[];const r=c.ranked.filter(x=>x.pct>0);if(!r.length)return[];
  const lead=r[0].pct;const segs=r.filter(x=>x.pct>=lead*0.6).slice(0,3);
  const total=segs.reduce((a,s)=>a+s.pct,0)||1;
  return segs.map(s=>({key:s.key,color:s.color,label:s.label,short:s.short,frac:s.pct/total,pct:s.pct}));
}
function blendName(c){const segs=bandSegments(c);if(segs.length<=1)return caps(shortOf(segs[0]?.key||c.ranked[0].key));return segs.slice(0,2).map(s=>caps(shortOf(s.key))).join("-");}
function caps(s){return s.charAt(0)+s.slice(1).toLowerCase();}


const STRAINS=[
  { id:"jb", name:"Jelly Breath", cross:"Mendo Breath × Do-Si-Dos",
    lot:"JB 071823", sample:"2310CH0095.0417", harvest:"07/18/2023",
    thc:"17.57", cbd:"0.04", cann:"19.86", terps:"2.32",
    aroma:"Dark, hoppy earth and cracked pepper over a diesel funk, with licorice and soft magnolia resin.",
    top:"Hops, lemon peel, magnolia, faint green fruit", mid:"Pepper, licorice, resin wood, soft floral", base:"Myrcene earth, hoppy spice, damp herb, dark sweetness",
    tags:[["earthy_dank","dark earth"],["spicy_warm","cracked pepper"],["gas_fuel","hoppy gas"],["dessert_creamy","licorice"],["floral_soft","magnolia resin"],["citrus_bright","lemon peel"]],
    copy:[
      "Jelly Breath leads with a darker kind of weight: dense myrcene earth, cracked pepper, and a hoppy diesel funk, edged with licorice and a soft magnolia resin.",
      "Myrcene sets the grounded base and caryophyllene builds the spice-and-gas frame; limonene adds a clean lemon cut, while bisabolol, linalool, and the farnesenes turn the finish softer and more perfumed. Gas reads as a supporting note here — an emergent balance, not a single loud terpene.",
    ],
    values:{myrcene:0.64,caryophyllene:0.35,limonene:0.23,humulene:0.16,farnesene_b:0.12,pinene_b:0.12,bisabolol:0.10,linalool:0.09,farnesene_a:0.09,phytol:0.06,valencene:0.05,fenchol:0.04},
    panel:[["β-Myrcene",0.64],["β-Caryophyllene",0.35],["Anisole",0.27],["δ-Limonene",0.23],["α-Humulene",0.16],["cis-β-Farnesene",0.12],["β-Pinene",0.12],["α-Bisabolol",0.10],["Linalool",0.09],["α-Farnesene",0.09],["trans-Phytol",0.06],["Valencene",0.05],["Endo-Fenchyl Alcohol",0.04]] },

  { id:"sdr", name:"Sunday Driver", cross:"Fruity Pebbles OG × Grape Pie",
    lot:"SDR 071823", sample:"2310CH0095.0413", harvest:"07/18/2023",
    thc:"23.11", cbd:"0.06", cann:"27.10", terps:"3.28",
    aroma:"Bright lemon oil folded into lavender and chamomile cream, finishing with soft pepper.",
    top:"Lemon oil, orange peel, bright citrus vapor", mid:"Lavender, chamomile, floral cream, soft spice", base:"Light herb, warm resin, sweet citrus, gentle pepper",
    tags:[["citrus_bright","lemon oil"],["floral_soft","lavender"],["floral_soft","chamomile cream"],["citrus_bright","soft citrus"],["spicy_warm","gentle spice"],["dessert_creamy","cream"]],
    copy:[
      "Sunday Driver is polished citrus over a soft floral interior: lemon oil first, then lavender, chamomile, and a creamy finish with just a whisper of pepper.",
      "Limonene leads the nose while linalool and bisabolol supply the lavender-cream softness; caryophyllene keeps a gentle spice spine underneath. It reads as the bright part of a lemon peel folded into a floral cream — refined, and built for a shelf where the nose matters as much as the number.",
    ],
    values:{limonene:0.91,linalool:0.49,caryophyllene:0.39,bisabolol:0.17,humulene:0.14,pinene_b:0.14,farnesene_b:0.14,ocimene:0.12,valencene:0.11,fenchol:0.10,terpineol:0.10,myrcene:0.10,farnesene_a:0.06,geranyl_acetate:0.05,phytol:0.04,camphene:0.03},
    panel:[["δ-Limonene",0.91],["Linalool",0.49],["β-Caryophyllene",0.39],["Anisole",0.19],["α-Bisabolol",0.17],["α-Humulene",0.14],["β-Pinene",0.14],["cis-β-Farnesene",0.14],["Ocimene",0.12],["Valencene",0.11],["Endo-Fenchyl Alcohol",0.10],["α-Terpineol",0.10],["β-Myrcene",0.10],["α-Farnesene",0.06],["Geranyl Acetate",0.05],["trans-Phytol",0.04],["Camphene",0.03]] },

  { id:"km", name:"Kush Mints", cross:"Bubba Kush × Animal Mints",
    lot:"KM 071823", sample:"2310CH0095.0412", harvest:"07/18/2023",
    thc:"34.64", cbd:"0.08", cann:"40.39", terps:"3.17",
    aroma:"Lemon oil and lavender up front, green resin and a cool mint-herb lift over a grounded kush finish.",
    top:"Lemon oil, green apple resin, mint-herb lift", mid:"Lavender, citrus rind, soft floral, pepper", base:"Kush earth, myrcene body, resin wood, hoppy spice",
    tags:[["citrus_bright","lemon oil"],["floral_soft","lavender"],["fruity_sweet","green resin"],["herbal_woody","mint-herb"],["earthy_dank","kush earth"],["spicy_warm","soft spice"]],
    copy:[
      "Kush Mints comes through sharper than the name suggests: lemon oil first, lavender close behind, then green resin and a quiet mint-herb lift cooling through the finish.",
      "Limonene drives the brightness and linalool gives the soft lavender center, while myrcene and caryophyllene hold the kush structure underneath and the farnesenes add a fresh green-resin note. Dense and high-definition — citrus on the inhale, floral resin through the middle, a grounded finish with enough lift to stay alive.",
    ],
    values:{limonene:0.91,linalool:0.50,myrcene:0.35,caryophyllene:0.28,farnesene_b:0.19,pinene_b:0.14,farnesene_a:0.14,valencene:0.11,fenchol:0.10,terpineol:0.10,humulene:0.09,bisabolol:0.04,nerolidol:0.04,terpinolene:0.03,phytol:0.03,camphene:0.03},
    panel:[["δ-Limonene",0.91],["Linalool",0.50],["β-Myrcene",0.35],["β-Caryophyllene",0.28],["cis-β-Farnesene",0.19],["β-Pinene",0.14],["α-Farnesene",0.14],["Valencene",0.11],["Endo-Fenchyl Alcohol",0.10],["α-Terpineol",0.10],["α-Humulene",0.09],["Anisole",0.09],["α-Bisabolol",0.04],["trans-Nerolidol",0.04],["Terpinolene",0.03],["trans-Phytol",0.03],["Camphene",0.03]] },
];

export { PROFILES, TERPENES, classify, bandSegments, blendName, STRAINS };
