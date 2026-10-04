import {videoLibrary} from './video-library.js';

export function initVideoGallery(document=window.document){
 const video=document.getElementById('home-promo'),gallery=document.getElementById('film-gallery');
 if(!video||!gallery)return null;
 const byId=id=>document.getElementById(id),play=byId('film-play'),status=byId('promo-status'),quality=byId('film-quality');
 const available=videoLibrary.filter(film=>film.status==='ready');
 byId('film-count').textContent=available.length+' 部短片 · 点击封面自由切换';
 let active=available[0],revision=0,resumeHandler=null;
 const positions=new Map();
 const sourceFor=()=>quality.value==='original'&&active.original?active.original:active.src;
 function stopDecorations(){document.body.dataset.videoPlaying=String(!video.paused&&!video.ended);}
 function syncPlayback(){play.textContent=video.paused||video.ended?'播放这部短片 ▶':'暂停播放 Ⅱ';stopDecorations();}
 async function start(){const ownRevision=revision;status.textContent='正在加载选中的短片…';try{await video.play();if(ownRevision===revision)syncPlayback();}catch(error){if(ownRevision===revision&&error.name!=='AbortError')status.textContent='可点击视频内的播放按钮重试；网络较慢时请选择流畅版。';}}
 function updateDetails(){
  const index=available.indexOf(active);
  byId('film-counter').textContent=String(index+1).padStart(2,'0')+' / '+String(available.length).padStart(2,'0');
  byId('film-title').textContent=active.title;byId('film-description').textContent=active.description;
  byId('film-meta').textContent=`约 ${active.duration} 秒 · ${active.format}`;
  video.setAttribute('aria-label',active.title);video.poster=active.poster;
  video.closest('.promo-screen').dataset.orientation=active.format.includes('竖')?'portrait':'landscape';
  byId('film-quality-label').hidden=!active.original;
  byId('film-open').href=sourceFor();
  gallery.querySelectorAll('[data-film-id]').forEach(button=>{const selected=button.dataset.filmId===active.id;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('is-selected',selected);});
 }
 function load(film,shouldPlay=false,time=0){
  positions.set(active.id,Number.isFinite(video.currentTime)?video.currentTime:0);
  video.pause();revision++;
  if(resumeHandler)video.removeEventListener('loadedmetadata',resumeHandler);
  const ownRevision=revision;active=film;updateDetails();
  video.querySelector('source').src=sourceFor();video.load();
  resumeHandler=()=>{if(ownRevision!==revision)return;if(time>0&&time<video.duration)video.currentTime=time;};
  video.addEventListener('loadedmetadata',resumeHandler,{once:true});
  syncPlayback();status.textContent='已选择「'+active.title+'」。点击播放才加载视频。';
  if(shouldPlay)void start();
 }
 function select(film){if(film===active){if(video.paused||video.ended)void start();}else{quality.value='smooth';load(film,true,positions.get(film.id)||0);}video.closest('.film-feature').scrollIntoView?.({block:'start',behavior:document.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 gallery.replaceChildren();
 available.forEach((film,index)=>{
  const card=document.createElement('button');
  card.className='film-card';card.type='button';card.dataset.filmId=film.id;card.setAttribute('aria-pressed',String(film===active));card.addEventListener('click',()=>select(film));
  const cover=document.createElement('div');cover.className='film-cover';
  if(film.poster){const image=document.createElement('img');image.src=film.poster;image.alt='';image.loading='lazy';image.decoding='async';cover.append(image);}
  const badge=document.createElement('span');badge.className='film-cover-badge';badge.textContent='▶  '+film.duration+' 秒';
  const number=document.createElement('span');number.className='film-cover-number';number.textContent=String(index+1).padStart(2,'0');cover.append(badge,number);
  const text=document.createElement('div');text.className='film-card-text';const category=document.createElement('p');category.className='film-category';category.textContent=film.category;const title=document.createElement('h4');title.textContent=film.title;const caption=document.createElement('p');caption.className='film-card-caption';caption.textContent='点击切换并播放 ↗';text.append(category,title,caption);card.append(cover,text);gallery.append(card);
 });
 updateDetails();
 play.addEventListener('click',()=>{if(video.paused||video.ended)void start();else video.pause();});
 for(const [id,direction] of [['film-prev',-1],['film-next',1]])byId(id).addEventListener('click',()=>select(available[(available.indexOf(active)+direction+available.length)%available.length]));
 quality.addEventListener('change',()=>load(active,!video.paused,video.currentTime));
 video.addEventListener('play',()=>{syncPlayback();status.textContent='正在播放 · '+active.title+' · 可调整声音、进度或全屏。';});
 video.addEventListener('pause',()=>{syncPlayback();status.textContent='已暂停 · '+active.title+' · 点击播放可继续。';});
 video.addEventListener('ended',()=>{syncPlayback();status.textContent='播放结束 · 选另一部短片，或点击播放再看一次。';});
 video.addEventListener('loadedmetadata',()=>{byId('film-meta').textContent=`约 ${Math.round(video.duration)} 秒 · ${active.format}`;});
 for(const event of ['waiting','stalled'])video.addEventListener(event,()=>{if(!video.paused)status.textContent='正在缓冲…流畅版已降低流量；也可稍等片刻再播放。';});
 video.addEventListener('playing',()=>{status.textContent='正在播放 · '+active.title+' · 可调整声音、进度或全屏。';});
 video.addEventListener('error',()=>{syncPlayback();status.textContent='视频未能加载，请重试或使用独立播放器链接。';});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();});
 const observer=new MutationObserver(()=>{if(document.body.dataset.view!=='home')video.pause();});observer.observe(document.body,{attributes:true,attributeFilter:['data-view']});
 return {select:id=>{const film=available.find(f=>f.id===id);if(film)select(film);},activeId:()=>active.id};
}
