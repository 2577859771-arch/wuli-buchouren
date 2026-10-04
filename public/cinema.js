import {experimentLink} from './experiment-links.js';
import {initVideoGallery} from './video-gallery.js';
const $=selector=>document.querySelector(selector);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function syncView(){document.body.dataset.view=!$('#home-view').hidden?'home':'lesson';$('.skip-link').href=document.body.dataset.view==='home'?'#home-view':!$('#math-view').hidden?'#math-view':'#lab-view';}
syncView();addEventListener('hashchange',()=>{syncView();window.scrollTo({top:0,left:0,behavior:'instant'});});
const initialQuery=new URLSearchParams(location.search);
if(initialQuery.get('lesson')==='projectile'){const v=Number(initialQuery.get('v0')),h=Number(initialQuery.get('h'));if(Number.isFinite(v)&&Number.isFinite(h)){try{window.physicsApp.configure({v,h});}catch{/* invalid external values never override model bounds */}}}
function scrollSection(id){if(document.body.dataset.view!=='home'){location.hash='home';setTimeout(()=>scrollSection(id),80);return;}const section=document.getElementById(id);section?.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});if(id==='ask-section')setTimeout(()=>$('#question')?.focus({preventScroll:true}),450);}
document.addEventListener('click',event=>{const control=event.target.closest('[data-scroll]');if(control)scrollSection(control.dataset.scroll);});
if('IntersectionObserver'in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.08});document.querySelectorAll('.reveal').forEach(section=>{section.classList.add('observed');observer.observe(section);});}

/* The introductory experiment is calculated locally, not a fake AI response. */
const h=19.6,g=9.8,total=Math.sqrt(2*h/g),vA=10;
let vB=20,time=0,playing=false,last=0,raf=0;
const svg=$('#compare-scene');
function renderCompare(){
 const extent=Math.max(vA,vB)*total*1.06;const x0=57,y0=46,W=606,H=240;
 const position=(v,t)=>[x0+v*t/extent*W,y0+g*t*t/(2*h)*H];
 const path=(v,end)=>Array.from({length:61},(_,i)=>{const[x,y]=position(v,end*i/60);return(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);}).join(' ');
 let output='';for(let i=0;i<=10;i++)output+=`<path d="M${x0+i*W/10} ${y0}V${y0+H}" stroke="#c4e1cd0b"/>`;for(let i=0;i<=5;i++)output+=`<path d="M${x0} ${y0+i*H/5}H${x0+W}" stroke="#c4e1cd0b"/>`;
 output+=`<path d="M${x0} ${y0-14}V${y0+H}H${x0+W}" stroke="#819d9344" fill="none"/><text x="${x0-8}" y="${y0-21}" fill="#92aca0" font-size="10">释放点 · 19.6 m</text><text x="${x0+W-12}" y="${y0+H+27}" fill="#92aca0" font-size="10" text-anchor="end">水平距离 / m →</text><text x="${x0-9}" y="${y0+H+4}" fill="#92aca0" font-size="10" text-anchor="end">0</text>`;
 for(const[v,color,label]of [[vA,'#b4e8bd','A'],[vB,'#89b4ef','B']]){
  output+=`<path d="${path(v,total)}" fill="none" stroke="${color}" stroke-opacity=".15" stroke-dasharray="3 6"/><path d="${path(v,time)}" fill="none" stroke="${color}" stroke-width="2"/>`;
  for(let t=.15;t<time;t+=.15){const[x,y]=position(v,t);output+=`<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity=".45"/>`;}
  const[x,y]=position(v,time);output+=`<circle cx="${x}" cy="${y}" r="13" fill="${color}" opacity=".07"/><circle cx="${x}" cy="${y}" r="6" fill="${color}"/><text x="${x+11}" y="${y-8}" fill="${color}" font-size="10">${label}</text>`;
 }
 const[yA]=position(vA,total),[yB]=position(vB,total);output+=`<text x="${yA}" y="${y0+H+15}" text-anchor="middle" fill="#b4e8bd" font-size="10">20 m</text><text x="${yB}" y="${y0+H+28}" text-anchor="middle" fill="#89b4ef" font-size="10">${(vB*total).toFixed(0)} m</text>`;
 svg.innerHTML=output;svg.setAttribute('aria-label',`双球平抛：高度19.6米，A球10米每秒，B球${vB}米每秒；同一时刻${time.toFixed(2)}秒，两球下落高度相同。`);
 $('#demo-time').textContent='t = '+time.toFixed(2)+' s';$('#compare-speed').textContent=vB;$('#compare-output').textContent=vB+' m/s';$('#compare-range').innerHTML=(vB*total).toFixed(2)+' <small>m</small>';
 $('#compare-play').textContent=playing?'Ⅱ 暂停':time>=total?'↺ 再试一次':'▶ 同时发射';
}
function pauseCompare(){playing=false;last=0;cancelAnimationFrame(raf);raf=0;renderCompare();}
function tick(now){if(!playing)return;if(last)time=Math.min(total,time+(now-last)/2000);last=now;renderCompare();if(time>=total){pauseCompare();$('#prediction-feedback').textContent='同时落地！横着飞得更快，只会飞得更远，不会缩短下落时间。';return;}raf=requestAnimationFrame(tick);}
function startCompare(){if(playing){pauseCompare();return;}if(time>=total)time=0;playing=true;last=0;raf=requestAnimationFrame(tick);renderCompare();}
$('#compare-play').addEventListener('click',startCompare);$('#compare-reset').addEventListener('click',()=>{time=0;pauseCompare();});
$('#compare-slider').addEventListener('input',event=>{vB=Number(event.target.value);time=0;pauseCompare();$('#prediction-feedback').textContent='只改变 B 球的水平速度，再猜一次。';});
document.querySelectorAll('[data-prediction]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-prediction]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});$('#prediction-feedback').textContent=button.dataset.prediction==='same'?'你的预测是同时落地。来验证一下。':'看看实验是否支持你的预测。';time=0;if(playing)pauseCompare();startCompare();}));
$('#demo-to-lesson').addEventListener('click',()=>{location.hash='projectile';setTimeout(()=>{window.physicsApp?.configure({v:vB,h});scrollTo({top:0,behavior:'auto'});},70);});
addEventListener('visibilitychange',()=>{if(document.hidden)pauseCompare();});addEventListener('hashchange',()=>{if(document.body.dataset.view!=='home')pauseCompare();});renderCompare();

/* Keep the precise controls and 2D/3D links up to date after lesson rendering. */
let enhancementScheduled=false;
function lessonEnhancements(){
 const state=window.physicsApp?.getState();if(!state)return;
 const title=$('#lesson-title');if(!title)return;
 let bar=$('#lesson-bridge');
 if(!bar){bar=document.createElement('div');bar.id='lesson-bridge';bar.className='lesson-bridge';$('#lab-view .page-heading').after(bar);}
 const link=experimentLink(state.topic,state.parameters||{});const theme=document.documentElement.dataset.theme;
 if(link){link.searchParams.set('theme',theme==='dark'?'dark':'light');if(bar.dataset.href!==link.href){bar.replaceChildren();const note=document.createElement('span');note.textContent=state.topic==='projectile'?'二维与三维使用相同题目条件':'三维参考实验使用独立条件，请在实验内核对参数';const a=document.createElement('a');a.href=link.href;a.textContent=state.topic==='projectile'?'按当前条件打开 3D 实验 ↗':'打开对应 3D 参考实验 ↗';bar.append(note,a);bar.dataset.href=link.href;}bar.hidden=false;}else{bar.hidden=true;bar.dataset.href='';}
 for(const range of document.querySelectorAll('#parameter-controls input[type="range"]')){
  if(range.parentElement.querySelector('.precise-field'))continue;
  const wrapper=document.createElement('div');wrapper.className='precise-field';const input=document.createElement('input');input.type='number';input.min=range.min;input.max=range.max;input.step=range.step;input.value=range.value;input.setAttribute('aria-label',range.getAttribute('aria-label')+'精确数值');const text=document.createElement('span');text.textContent='也可直接输入数值';const err=document.createElement('span');err.className='precise-error';err.setAttribute('role','status');
  input.addEventListener('change',()=>{if(!input.checkValidity()||!Number.isFinite(input.valueAsNumber)){err.textContent=`请输入 ${range.min}–${range.max} 的有效数值`;return;}err.textContent='';range.value=input.value;range.dispatchEvent(new Event('input',{bubbles:true}));input.value=range.value;});range.addEventListener('input',()=>input.value=range.value);wrapper.append(input,text,err);range.after(wrapper);
 }
}
function scheduleEnhancements(){if(enhancementScheduled)return;enhancementScheduled=true;requestAnimationFrame(()=>{enhancementScheduled=false;lessonEnhancements();});}
document.addEventListener('input',event=>{if(event.target.closest('#parameter-controls'))scheduleEnhancements();});
new MutationObserver(scheduleEnhancements).observe($('#parameter-controls'),{childList:true});new MutationObserver(scheduleEnhancements).observe($('#lesson-title'),{childList:true});addEventListener('hashchange',scheduleEnhancements);new MutationObserver(scheduleEnhancements).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});scheduleEnhancements();
$('#share-site').addEventListener('click',async()=>{const url=new URL(location.href);url.hash='home';url.search='';try{if(navigator.share){await navigator.share({title:'物理不愁人 · 把“我会了”，变成真会了',text:'先猜，再亲手验证。物理实验和课程无需登录。',url:url.href});}else{await navigator.clipboard.writeText(url.href);$('#share-site').textContent='链接已复制 ✓';setTimeout(()=>$('#share-site').textContent='分享网站 ↗',2200);}}catch(error){if(error.name!=='AbortError')$('#share-site').textContent='可复制浏览器中的网站地址';}});
/* One on-demand player for the whole collection: other films do not compete for bandwidth. */
initVideoGallery();
new MutationObserver(()=>{if(document.body.dataset.videoPlaying==='true')pauseCompare();}).observe(document.body,{attributes:true,attributeFilter:['data-video-playing']});
