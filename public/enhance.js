// 便利功能：全站搜索（Ctrl/⌘+K 或 /）、收藏与最近学习、深色模式、公式手册筛选、返回顶部。
// 本地偏好只保存在当前浏览器（localStorage），读写均有容错，不可用时功能自动降级。
import {lessons} from './content.js';
import {workedExamples} from './worked-examples.js';
import {mathModules} from './math-content.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const plain=h=>String(h||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const store={get(k,d){try{const v=localStorage.getItem('wlbcr:'+k);return v?JSON.parse(v):d;}catch{return d;}},set(k,v){try{localStorage.setItem('wlbcr:'+k,JSON.stringify(v));}catch{}}};
const byId=id=>lessons.find(l=>l.id===id);

/* ---------- 深色模式 ---------- */
function applyTheme(t){document.documentElement.dataset.theme=t;const b=$('#theme-toggle');if(b){b.textContent=t==='dark'?'☀':'☾';b.setAttribute('aria-label',t==='dark'?'切换到浅色模式':'切换到深色模式');b.title=b.getAttribute('aria-label');}}
const prefersDark=()=>{try{return matchMedia('(prefers-color-scheme: dark)').matches;}catch{return false;}};
applyTheme(store.get('theme','dark'));

/* ---------- 顶栏工具 ---------- */
const tools=document.createElement('div');tools.className='top-tools';
tools.innerHTML='<button id="search-open" class="search-trigger" aria-label="搜索知识点、公式和典例"><span aria-hidden="true">⌕</span><span class="search-trigger-text">搜索知识点、公式</span><kbd>/</kbd></button><button id="theme-toggle" class="icon-button"></button>';
$('.topbar').insertBefore(tools,$('#account-button'));applyTheme(document.documentElement.dataset.theme);
$('#theme-toggle').addEventListener('click',()=>{const t=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(t);store.set('theme',t);});

/* ---------- 搜索索引 ---------- */
const index=[];
for(const l of lessons){const lv=l.levels.includes('high')?'高中':'大学';
 index.push({kind:'专题',topic:l.id,title:l.title,sub:l.category+' · '+lv,text:[l.title,l.description,l.category,...l.knowledge,...(l.details||[]).map(d=>d.title+d.text),...(l.mechanics?.notes||[]).map(n=>n.title+n.text+n.equation)].map(plain).join(' ')});
 for(const f of l.formulas)index.push({kind:'公式',topic:l.id,title:f.label+'：'+plain(f.equation),sub:l.title+' · '+plain(f.condition),text:plain(f.label+f.equation+f.symbols+f.condition+l.title)});
 const ex=workedExamples[l.id];if(ex)index.push({kind:'典例',topic:l.id,anchor:'ex-'+l.id,title:plain(ex.q).slice(0,46)+'…',sub:l.title+' 典例',text:plain(ex.q+ex.ans+l.title)});}
for(const m of mathModules)index.push({kind:'数学',topic:'math-'+m.id,title:m.title,sub:'大学数学工具 · '+m.tag,text:[m.title,m.summary,...m.points,m.example.q,...m.example.steps].join(' ')});
function search(q){q=q.trim().toLowerCase();if(!q)return[];const terms=q.split(/\s+/);const scored=[];for(const e of index){const t=e.text.toLowerCase(),ti=e.title.toLowerCase();if(!terms.every(w=>t.includes(w)))continue;let s=0;for(const w of terms){if(ti.includes(w))s+=5;if(ti.startsWith(w))s+=3;}s+=e.kind==='专题'?2:e.kind==='公式'?1:0;scored.push([s,e]);}return scored.sort((a,b)=>b[0]-a[0]).slice(0,30).map(x=>x[1]);}
function mark(text,q){let out=esc(text);for(const w of q.trim().split(/\s+/).filter(Boolean)){const r=new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');out=out.replace(r,m=>'<mark>'+m+'</mark>');}return out;}

/* ---------- 搜索面板 ---------- */
const dlg=document.createElement('dialog');dlg.id='search-dialog';dlg.className='search-dialog';
dlg.innerHTML='<div class="search-box"><span aria-hidden="true">⌕</span><input id="search-input" type="search" autocomplete="off" placeholder="输入关键词，例如：动量、楞次、临界角、RC" aria-label="搜索"><button id="search-close" aria-label="关闭搜索">Esc</button></div><div id="search-results" class="search-results" role="listbox"></div><p class="search-foot">↑↓ 选择 · Enter 打开 · 可搜索专题、公式和典例</p>';
document.body.append(dlg);
let results=[],active=0;
function renderResults(){const q=$('#search-input').value,box=$('#search-results');results=search(q);active=0;
 if(!q.trim()){const recent=store.get('recent',[]).map(byId).filter(Boolean);box.innerHTML=recent.length?'<p class="search-hint">最近学习</p>'+recent.map((l,i)=>`<button class="search-item" data-i="${i}" data-go="${l.id}"><span class="search-kind">专题</span><span><b>${esc(l.title)}</b><small>${esc(l.category)}</small></span></button>`).join(''):'<p class="search-hint">试试搜索“平抛”“F = ma”“全反射”或“半衰期”。</p>';return;}
 box.innerHTML=results.length?results.map((e,i)=>`<button class="search-item${i===0?' active':''}" data-i="${i}" data-go="${e.topic}" ${e.anchor?`data-anchor="${e.anchor}"`:''}><span class="search-kind k-${e.kind}">${e.kind}</span><span><b>${mark(e.title,q)}</b><small>${esc(e.sub)}</small></span></button>`).join(''):'<p class="search-hint">没有找到相关内容。换个说法试试，例如用物理量名称或公式符号。</p>';}
function openSearch(){if(!dlg.open)dlg.showModal();$('#search-input').value='';renderResults();setTimeout(()=>$('#search-input').focus(),0);}
function go(topic,anchor){dlg.open&&dlg.close();if(location.hash==='#'+topic)window.dispatchEvent(new HashChangeEvent('hashchange'));else location.hash=topic;if(anchor)setTimeout(()=>{const el=document.getElementById(anchor);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600);}},260);}
$('#search-open').addEventListener('click',openSearch);$('#search-close').addEventListener('click',()=>dlg.close());
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();const b=e.target.closest('[data-go]');if(b)go(b.dataset.go,b.dataset.anchor);});
$('#search-input').addEventListener('input',renderResults);
$('#search-input').addEventListener('keydown',e=>{const items=$$('#search-results .search-item');if(!items.length)return;if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();active=(active+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items.forEach((b,i)=>b.classList.toggle('active',i===active));items[active].scrollIntoView({block:'nearest'});}if(e.key==='Enter'){e.preventDefault();items[active].click();}});
document.addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');if((e.key==='k'&&(e.ctrlKey||e.metaKey))||(e.key==='/'&&!typing)){e.preventDefault();openSearch();}});

/* ---------- 收藏与最近学习 ---------- */
let favs=store.get('favs',[]);
function favButton(){const h=$('#lab-view .page-heading');if(!h)return;let b=$('#fav-toggle');if(!b){b=document.createElement('button');b.id='fav-toggle';b.className='fav-toggle';h.append(b);b.addEventListener('click',()=>{const id=b.dataset.id;favs=favs.includes(id)?favs.filter(x=>x!==id):[id,...favs].slice(0,30);store.set('favs',favs);updateFav();renderHomeLists();});}updateFav();}
function currentTopic(){const h=location.hash.slice(1);return byId(h)?h:null;}
function updateFav(){const b=$('#fav-toggle');const id=currentTopic()||b?.dataset.id;if(!b||!id)return;b.dataset.id=id;const on=favs.includes(id);b.classList.toggle('on',on);b.innerHTML=on?'★ 已收藏':'☆ 收藏';b.setAttribute('aria-pressed',on);}
function track(){const id=currentTopic();if(!id)return;let r=store.get('recent',[]);r=[id,...r.filter(x=>x!==id)].slice(0,8);store.set('recent',r);updateFav();renderHomeLists();}
function renderHomeLists(){const host=$('.home-learning');if(!host)return;let box=$('#home-personal');if(!box){box=document.createElement('div');box.id='home-personal';host.prepend(box);}
 const row=(title,ids)=>{const ls=ids.map(byId).filter(Boolean);return ls.length?`<div class="personal-row"><h2>${title}</h2><div class="chip-row">${ls.map(l=>`<button class="chip" data-topic="${l.id}">${esc(l.title)}</button>`).join('')}</div></div>`:'';};
 box.innerHTML=row('我的收藏',favs)+row('最近学习',store.get('recent',[]));}
window.addEventListener('hashchange',()=>setTimeout(track,0));

/* ---------- 公式手册：筛选、展开全部 ---------- */
function formulaTools(){const view=$('#formulas-view');if(!view||$('#formula-tools'))return;const bar=document.createElement('div');bar.id='formula-tools';bar.className='formula-tools';
 bar.innerHTML='<label class="filter-field"><span aria-hidden="true">⌕</span><input id="formula-filter" type="search" placeholder="筛选公式：输入物理量、符号或专题名" aria-label="筛选公式"></label><button id="formula-expand" class="outline-button">全部展开</button><span id="formula-count" class="filter-count"></span>';
 view.querySelector('.page-heading').after(bar);
 $('#formula-filter').addEventListener('input',filterFormulas);
 $('#formula-expand').addEventListener('click',()=>{const entries=$$('#formula-groups .formula-entry:not([hidden])');const open=!entries.every(d=>d.open);entries.forEach(d=>d.open=open);$('#formula-expand').textContent=open?'全部收起':'全部展开';});}
function filterFormulas(){const q=($('#formula-filter')?.value||'').trim().toLowerCase();let shown=0;
 for(const g of $$('#formula-groups .formula-group')){let any=false;for(const d of g.querySelectorAll('.formula-entry')){const hit=!q||d.textContent.toLowerCase().includes(q);d.hidden=!hit;if(hit){any=true;shown++;}if(q&&hit){for(const f of d.querySelectorAll('.knowledge-formula'))f.classList.toggle('dim',!f.textContent.toLowerCase().includes(q)&&!d.querySelector('summary').textContent.toLowerCase().includes(q));}else d.querySelectorAll('.knowledge-formula.dim').forEach(f=>f.classList.remove('dim'));}g.hidden=!any;}
 const c=$('#formula-count');if(c)c.textContent=q?`找到 ${shown} 个专题`:'';
 if(q&&shown&&shown<=3)$$('#formula-groups .formula-entry:not([hidden])').forEach(d=>d.open=true);}
new MutationObserver(()=>{if($('#formula-filter')?.value)filterFormulas();}).observe($('#formula-groups'),{childList:true});

/* ---------- 返回顶部 ---------- */
const top=document.createElement('button');top.className='back-top';top.setAttribute('aria-label','返回顶部');top.textContent='↑';document.body.append(top);
top.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));
addEventListener('scroll',()=>top.classList.toggle('show',scrollY>600),{passive:true});

/* ---------- 页面切换时滚回顶部 ---------- */
window.addEventListener('hashchange',()=>{if(!/^#ex-/.test(location.hash))scrollTo({top:0});});

favButton();formulaTools();track();renderHomeLists();
