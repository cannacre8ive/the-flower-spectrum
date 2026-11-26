// A short vertical clip of one flower's Spectrum ID, drawn on canvas and recorded in the browser.
import {PROFILES} from './engine.js';
export const CLIP={width:1080,height:1920,duration:7,fps:30};
const serif='Newsreader, Georgia, serif',sans='"DM Sans", Arial, sans-serif';
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>1-Math.pow(1-clamp(v),3),span=(t,start,len)=>ease((t-start)/len);
function fitFont(ctx,value,size,max,family,weight=400){let s=size;do{ctx.font=`${weight} ${s}px ${family}`;s-=4;}while(ctx.measureText(value).width>max&&s>28);}
function wedge(ctx,cx,cy,inner,outer,start,end){ctx.beginPath();ctx.arc(cx,cy,outer,start,end);ctx.arc(cx,cy,inner,end,start,true);ctx.closePath();}
// data: {name,farm,handle,blend,ranked,segments,top:[[label,value]],total,code,photo}
export function drawClip(ctx,data,t){
 const {width:w,height:h}=CLIP,lead=data.ranked[0];
 ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#151713';ctx.fillRect(0,0,w,h);
 if(data.photo){
  const img=data.photo,zoom=1.06+.1*(t/CLIP.duration),scale=Math.max(w/img.width,h/img.height)*zoom,dw=img.width*scale,dh=img.height*scale;
  ctx.globalAlpha=.9*span(t,0,.8);ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);ctx.globalAlpha=1;
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(14,14,12,.82)');g.addColorStop(.35,'rgba(14,14,12,.62)');g.addColorStop(.62,'rgba(14,14,12,.84)');g.addColorStop(1,'rgba(14,14,12,.96)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }
 // Wordmark: the ten-color strip wipes in, one profile at a time.
 PROFILES.forEach((p,i)=>{const a=span(t,.1+i*.05,.3);ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.fillRect(68+i*8,96,8,34*a);});
 ctx.globalAlpha=span(t,.5,.5);ctx.fillStyle='#eee9dd';ctx.font=`600 36px ${serif}`;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillText('Flower Spectrum',166,126);
 ctx.fillStyle='#c1bdaf';ctx.font=`400 26px ${sans}`;ctx.textAlign='right';ctx.fillText(data.farm,1012,124);
 // Fingerprint: guide rings settle, then each fixed sector grows to its relative strength.
 const cx=540,cy=790,k=1.9*(.94+.06*span(t,.5,2)+.025*(t/CLIP.duration)),scores=Object.fromEntries(data.ranked.map(p=>[p.key,p.pct])),max=Math.max(...Object.values(scores),1);
 ctx.globalAlpha=.5*span(t,.6,.7);ctx.strokeStyle='#778367';
 [54,100,148,196].forEach(r=>{ctx.lineWidth=r===196?2:1.4;ctx.setLineDash(r===196?[]:[4,10]);ctx.beginPath();ctx.arc(cx,cy,r*k,0,Math.PI*2);ctx.stroke();});ctx.setLineDash([]);
 PROFILES.forEach((p,i)=>{
  const start=-Math.PI/2+i*Math.PI/5+.025,end=start+Math.PI/5-.05,v=scores[p.key]||0,grow=span(t,1+i*.13,.9);
  ctx.globalAlpha=.07*span(t,.6,.7);ctx.fillStyle=p.color;wedge(ctx,cx,cy,54*k,196*k,start,end);ctx.fill();
  if(v>0&&grow>0){ctx.globalAlpha=.96;wedge(ctx,cx,cy,54*k,(54+142*v/max*grow)*k,start,end);ctx.fill();}
 });
 ctx.globalAlpha=span(t,.9,.5);ctx.fillStyle=lead.color;ctx.beginPath();ctx.arc(cx,cy,7*k,0,Math.PI*2);ctx.fill();
 // Identity
 let a=span(t,3,.7);ctx.globalAlpha=a;ctx.textAlign='left';ctx.fillStyle='#eee9dd';fitFont(ctx,data.name,124,944,serif);ctx.fillText(data.name,68,1340+36*(1-a));
 a=span(t,3.3,.7);ctx.globalAlpha=a;ctx.fillStyle=lead.color;ctx.font=`400 42px ${sans}`;ctx.fillText(data.blend+'  ·  '+data.total.toFixed(2)+'% terpenes',70,1410+24*(1-a));
 // Strip sweeps in from the left.
 const sweep=span(t,3.8,.9);ctx.globalAlpha=1;ctx.save();ctx.beginPath();ctx.rect(68,1464,944*sweep,66);ctx.clip();let x=68;
 data.segments.forEach(s=>{ctx.fillStyle=s.color;ctx.fillRect(x,1464,944*s.frac+1,66);x+=944*s.frac;});ctx.restore();
 data.top.slice(0,3).forEach(([label,value],i)=>{a=span(t,4.6+i*.16,.6);ctx.globalAlpha=a;const y=1614+i*60+18*(1-a);
  ctx.fillStyle='#dedaca';ctx.font=`400 36px ${sans}`;ctx.textAlign='left';ctx.fillText(label,68,y);ctx.textAlign='right';ctx.fillStyle='#eee9dd';ctx.fillText(value.toFixed(2)+'%',1012,y);});
 a=span(t,5.5,.6);ctx.globalAlpha=a;ctx.fillStyle='#414837';ctx.fillRect(68,1800,944,2);
 ctx.fillStyle='#a4ab97';ctx.font=`400 26px ${sans}`;ctx.textAlign='left';ctx.fillText('Spectrum ID  '+data.code,68,1850);ctx.textAlign='right';ctx.fillStyle='#c4b275';ctx.fillText(data.handle,1012,1850);
 ctx.restore();
}
export async function clipFonts(){if(document.fonts?.load)await Promise.all([document.fonts.load(`600 36px Newsreader`),document.fonts.load(`400 36px "DM Sans"`)]).catch(()=>{});}
export function clipMime(){
 if(typeof MediaRecorder==='undefined')return null;
 return ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m))||null;
}
// Plays once in real time while recording the canvas. Resolves with {blob,extension}.
export function recordClip(canvas,data,onProgress=()=>{}){
 const mime=clipMime();if(!mime||!canvas.captureStream)return Promise.reject(Error('This browser cannot record video.'));
 return new Promise((resolve,reject)=>{
  const ctx=canvas.getContext('2d'),stream=canvas.captureStream(CLIP.fps),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10_000_000}),chunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  recorder.onerror=e=>reject(e.error||Error('Recording failed'));
  recorder.onstop=()=>{stream.getTracks().forEach(tr=>tr.stop());resolve({blob:new Blob(chunks,{type:mime.split(';')[0]}),extension:mime.startsWith('video/mp4')?'mp4':'webm'});};
  drawClip(ctx,data,0);recorder.start();const began=performance.now();
  (function frame(now){const t=(now-began)/1000;drawClip(ctx,data,Math.min(t,CLIP.duration));onProgress(Math.min(1,t/CLIP.duration));
   if(t<CLIP.duration+.25)requestAnimationFrame(frame);else recorder.stop();})(began);
 });
}
