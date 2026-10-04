import path from 'node:path';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {Readable} from 'node:stream';
// Media is streamed from disk, not embedded as base64 in the Worker bundle.
export function diskMediaAssets(root){
 return {async fetch(request){
  const url=new URL(request.url);
  let name;try{name=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}
  if(!/^\/media\/[a-z0-9][a-z0-9._-]*\.mp4$/.test(name))return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  const file=path.join(root,name.slice(1));let info;try{info=await stat(file);}catch{return new Response('Not found',{status:404});}
  if(!info.isFile())return new Response('Not found',{status:404});
  const etag=`"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
  const headers={'content-type':'video/mp4','accept-ranges':'bytes','cache-control':'public, max-age=3600','etag':etag,'x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
  if(request.headers.get('if-none-match')===etag&&!request.headers.has('range'))return new Response(null,{status:304,headers});
  let start=0,end=info.size-1,status=200;
  const range=request.headers.get('range');
  if(range&&(!request.headers.has('if-range')||request.headers.get('if-range')===etag)){
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...headers,'content-range':`bytes */${info.size}`}});
   if(!match[1])start=Math.max(0,info.size-Number(match[2]));
   else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size)return new Response(null,{status:416,headers:{...headers,'content-range':`bytes */${info.size}`}});
   status=206;headers['content-range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['content-length']=String(end-start+1);
  return new Response(request.method==='HEAD'?null:Readable.toWeb(createReadStream(file,{start,end})),{status,headers});
 }};
}
