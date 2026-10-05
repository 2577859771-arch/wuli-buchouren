import http from 'node:http';
import path from 'node:path';
import {mkdir,readFile,readdir} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import worker from '../dist/server/index.js';
import {diskMediaAssets} from './media-assets.mjs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const database=path.resolve(root,process.env.PHYSICS_DATABASE_PATH||'data/physics.sqlite');
await mkdir(path.dirname(database),{recursive:true});
const sqlite=new DatabaseSync(database);
sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS physics_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL);');
for(const name of (await readdir(path.join(root,'drizzle'))).filter(n=>/^\d{4}_.+\.sql$/.test(n)).sort()){
 if(sqlite.prepare('SELECT name FROM physics_migrations WHERE name=?').get(name))continue;
 sqlite.exec('BEGIN IMMEDIATE');
 try{sqlite.exec(await readFile(path.join(root,'drizzle',name),'utf8'));sqlite.prepare('INSERT INTO physics_migrations VALUES (?,?)').run(name,Date.now());sqlite.exec('COMMIT');}
 catch(error){sqlite.exec('ROLLBACK');throw error;}
}
const DB={prepare(text){let args=[];return{bind(...values){args=values;return this;},async first(){return sqlite.prepare(text).get(...args)||null;},async run(){return sqlite.prepare(text).run(...args);},async all(){return{results:sqlite.prepare(text).all(...args)};}};}};
const env={DB,ASSET_FILES:diskMediaAssets(path.join(root,'public'))};
for(const key of ['AI_PROVIDER','AI_DAILY_GLOBAL_LIMIT','AI_DAILY_USER_LIMIT','AI_DAILY_IP_LIMIT','QWEN_API_KEY','QWEN_BASE_URL','QWEN_MODEL','QWEN_VISION_MODEL','QWEN_RESPONSE_FORMAT','QWEN_ENABLE_THINKING','OPENAI_API_KEY','OPENAI_MODEL','OPENAI_VISION_MODEL','OPENAI_IMAGE_API_KEY','MAIL_API_KEY','MAIL_API_URL','MAIL_FROM','PUBLIC_ORIGIN'])if(process.env[key])env[key]=process.env[key];
const port=Number(process.env.PORT||4178),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
const publicOrigin=env.PUBLIC_ORIGIN?new URL(env.PUBLIC_ORIGIN).origin:`http://localhost:${port}`;
const previewOnly=process.env.PHYSICS_READONLY_PREVIEW==='true';
if(previewOnly)for(const key of ['QWEN_API_KEY','OPENAI_API_KEY','OPENAI_IMAGE_API_KEY','MAIL_API_KEY'])delete env[key];
const server=http.createServer(async(req,res)=>{
 try{
  const headers=new Headers();for(const[key,value]of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(', '):value);
  // Do not trust arbitrary forwarding headers to bypass IP rate limits.
  const remote=req.socket.remoteAddress||'unknown';headers.set('x-real-ip',remote);headers.delete('cf-connecting-ip');
  const limit=req.url?.startsWith('/api/ask')?2300000:16000;
  let body;
  if(!['GET','HEAD'].includes(req.method)){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit){res.writeHead(413);res.end('{"error":"内容过长。"}');return;}chunks.push(chunk);}body=Buffer.concat(chunks);}
  if(previewOnly&&req.url?.startsWith('/api/')&&!['/api/session','/api/ask','/api/health'].includes(req.url.split('?')[0])){res.writeHead(503,{'content-type':'application/json; charset=utf-8'});res.end('{"error":"此链接为设计预览，未接原站账号与模型服务。请在正式站点使用账号功能。"}');return;}
  let result=await worker.fetch(new Request(new URL(req.url,publicOrigin),{method:req.method,headers,body}),env,{});
  if(previewOnly&&req.url?.split('?')[0]==='/api/session')result=Response.json({...await result.json(),previewOnly:true});
  if(previewOnly&&req.method==='GET'&&req.url?.split('?')[0]==='/'){const html=(await result.text()).replace('<body>','<body><aside class="preview-notice" role="note">电影感新版 · 公开设计预览｜课程、实验和文字规则解析可用。此链接未接入原站账号与 AI 识图服务。</aside>');result=new Response(html,{status:result.status,headers:result.headers});}
  if(!previewOnly&&process.env.PHYSICS_CONNECTED_PREVIEW==='true'&&req.method==='GET'&&req.url?.split('?')[0]==='/'){const html=(await result.text()).replace('<body>','<body><aside class="preview-notice" role="note">临时体验版 · 18 项 3D 实验与千问识图已接入｜AI 答疑请用本站邮箱注册登录。此处账号与原 WorkBuddy 网站不互通。</aside>');result=new Response(html,{status:result.status,headers:result.headers});}
  res.writeHead(result.status,Object.fromEntries(result.headers));if(result.body)await pipeline(Readable.fromWeb(result.body),res);else res.end();
 }catch{if(res.headersSent){res.destroy();return;}res.writeHead(500,{'content-type':'application/json; charset=utf-8'});res.end('{"error":"服务暂不可用，输入已保留。"}');}
});
server.requestTimeout=120000;
server.listen(port,host,()=>console.log(`Physics server: ${publicOrigin} (persistent SQLite; provider status available at /api/session)`));
const cleanup=setInterval(()=>{try{const now=Date.now();sqlite.prepare('DELETE FROM limits WHERE expires_at<?').run(now-86400000);sqlite.prepare('DELETE FROM sessions WHERE expires_at<?').run(now);}catch{console.error('Expired record cleanup failed');}},3600000);cleanup.unref();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>{clearInterval(cleanup);sqlite.close();process.exit(0);}));
