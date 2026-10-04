import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import worker from '../dist/server/index.js';
import {diskMediaAssets} from './media-assets.mjs';
import path from 'node:path';
const env={ASSET_FILES:diskMediaAssets(path.resolve('public'))};
const get=(method='GET',headers={})=>worker.fetch(new Request('https://physics.example/media/physics-promo.mp4',{method,headers}),env);
const length=(await stat('public/media/physics-promo.mp4')).size;
let response=await get('HEAD');assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'video/mp4');assert.equal(Number(response.headers.get('content-length')),length);assert.equal(response.headers.get('accept-ranges'),'bytes');assert.equal(await response.text(),'');
response=await get('GET',{range:'bytes=0-63'});assert.equal(response.status,206);const prefix=new Uint8Array(await response.arrayBuffer());assert.equal(prefix.length,64);assert.equal(response.headers.get('content-range'),`bytes 0-63/${length}`);assert(new TextDecoder().decode(prefix).includes('ftyp'));
response=await get('GET',{range:'bytes=-64'});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,64);
response=await get('GET',{range:`bytes=${length+1}-`});assert.equal(response.status,416);
response=await get('GET',{range:'bytes=2-1'});assert.equal(response.status,416);
response=await get('GET',{range:'bytes=0-1,8-9'});assert.equal(response.status,416);
response=await env.ASSET_FILES.fetch(new Request('https://physics.example/media/%2e%2e%2fsecret.mp4'));assert.equal(response.status,404);
const {document}=parseHTML(await readFile('public/index.html','utf8'));const video=document.querySelector('#home-promo');assert(video);assert(video.hasAttribute('controls'));assert(video.hasAttribute('playsinline'));assert(!video.hasAttribute('autoplay'));assert.equal(video.getAttribute('preload'),'none');assert.equal(video.querySelector('source').getAttribute('src'),'/media/physics-promo-v2-stream.mp4');assert(document.querySelector('#film-gallery'));assert.equal(document.querySelectorAll('video').length,1);
for(const name of ['campus-film-stream.mp4','physics-story-stream.mp4','physics-lab-film-stream.mp4','physics-promo-v2-stream.mp4']){
 const bytes=await readFile('public/media/'+name);const atoms=[];let offset=0;
 while(offset+8<=bytes.length){let size=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);if(size===1){size=Number(bytes.readBigUInt64BE(offset+8));}if(size===0)size=bytes.length-offset;assert(size>=8);atoms.push({type,offset});offset+=size;}
 assert.equal(offset,bytes.length);assert(atoms.find(a=>a.type==='moov').offset<atoms.find(a=>a.type==='mdat').offset,'MP4 index must precede the movie data for fast start');assert(bytes.includes(Buffer.from('avc1')),'H.264 video required');assert(bytes.includes(Buffer.from('mp4a')),'AAC audio required');
 const res=await worker.fetch(new Request('https://physics.example/media/'+name,{headers:{range:'bytes=0-1023'}}),env);assert.equal(res.status,206);assert.equal((await res.arrayBuffer()).byteLength,1024);
}
assert((await stat('public/media/campus-film-stream.mp4')).size<length*.3,'campus stream must be at least 70% smaller than its original');assert((await stat('public/media/physics-story-stream.mp4')).size<7_000_000);
const poster=await worker.fetch(new Request('https://physics.example/media/promo-poster.jpg'),{});assert.equal(poster.status,200);assert.equal(poster.headers.get('content-type'),'image/jpeg');
console.log('PASS: homepage video, local poster, correct MP4 MIME, streamed byte-range seek, suffix/head and invalid/path-traversal handling.');
