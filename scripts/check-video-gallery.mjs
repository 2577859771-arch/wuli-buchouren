import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {videoLibrary} from '../public/video-library.js';
import {initVideoGallery} from '../public/video-gallery.js';
const html=await readFile('public/index.html','utf8'),{document,window}=parseHTML(html);
globalThis.MutationObserver=class {observe(){} disconnect(){}};
const video=document.querySelector('#home-promo');let loads=0,plays=0;video.paused=true;video.ended=false;video.currentTime=0;video.duration=70;
video.pause=()=>{video.paused=true;video.dispatchEvent(new window.Event('pause'));};
video.play=async()=>{plays++;video.paused=false;video.dispatchEvent(new window.Event('play'));};
video.load=()=>{loads++;};
// Linkedom does not implement HTMLSelectElement.value's setter.
const quality=document.querySelector('#film-quality');let qualityValue='smooth';Object.defineProperty(quality,'value',{get:()=>qualityValue,set:v=>{qualityValue=v;}});
const ready=videoLibrary.filter(f=>f.status==='ready');assert.equal(ready.length,4);assert.equal(videoLibrary.length,4);assert(videoLibrary.every(f=>f.status==='ready'));
for(const film of ready){await access('public'+film.src);await access('public'+film.poster);}
const controller=initVideoGallery(document);assert.equal(loads,0);assert.equal(plays,0);assert.equal(document.querySelectorAll('#film-gallery .film-card').length,4);assert.equal(document.querySelectorAll('#film-gallery button').length,4);assert.equal(document.querySelectorAll('#film-gallery article').length,0);assert.equal(document.querySelectorAll('#film-gallery .film-coming, #film-gallery .film-placeholder-art').length,0);assert(!/席位|敬请期待|即将上线/.test(document.querySelector('#film-count').textContent+document.querySelector('#film-gallery').textContent));assert.equal(document.querySelectorAll('video').length,1);assert.equal(quality.closest('label').hidden,true);assert.equal(controller.activeId(),ready[0].id);
document.querySelector('[data-film-id="campus-film"]').click();await Promise.resolve();assert.equal(controller.activeId(),'campus-film');assert.equal(loads,1);assert.equal(plays,1);assert.equal(video.querySelector('source').src,'/media/campus-film-stream.mp4');assert.equal(document.querySelector('[data-film-id="campus-film"]').getAttribute('aria-pressed'),'true');assert.equal(document.querySelector('#film-quality-label').hidden,false);assert.equal(document.body.dataset.videoPlaying,'true');
video.currentTime=9;quality.value='original';quality.dispatchEvent(new window.Event('change'));await Promise.resolve();assert.equal(video.querySelector('source').src,'/media/physics-promo.mp4');video.dispatchEvent(new window.Event('loadedmetadata'));assert.equal(video.currentTime,9);
document.querySelector('#film-next').click();await Promise.resolve();assert.equal(controller.activeId(),'promo-v2');assert.equal(quality.value,'smooth');assert.equal(video.querySelector('source').src,'/media/physics-promo-v2-stream.mp4');assert.equal(document.querySelector('#film-quality-label').hidden,true);
document.querySelector('#film-next').click();await Promise.resolve();assert.equal(controller.activeId(),'lab-film');assert.equal(video.querySelector('source').src,'/media/physics-lab-film-stream.mp4');
const beforeLoads=loads;controller.select('future-05');assert.equal(loads,beforeLoads);assert.equal(controller.activeId(),'lab-film');
document.querySelector('#film-play').click();assert.equal(video.paused,true);assert.equal(document.body.dataset.videoPlaying,'false');
video.pause();video.dispatchEvent(new window.Event('waiting'));assert(!document.querySelector('#promo-status').textContent.includes('缓冲'));
console.log('PASS: four playable films, no future slots or placeholder cards, only one on-demand player, explicit selection, quality switch, retained progress, pause and no background video downloads.');
