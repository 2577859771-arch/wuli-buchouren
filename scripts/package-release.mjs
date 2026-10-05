import {readFile,writeFile,mkdir,readdir,cp,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,'../output');
const name=process.env.PHYSICS_RELEASE_NAME||'物理不愁人-免费测试版-20261005';
if(!/^[\p{L}\p{N}_-]+$/u.test(name))throw new Error('Invalid release name');
const target=path.join(output,name),archive=target+'.zip';
for(const location of [target,archive]){try{await access(location);throw new Error('Release already exists; choose a new name rather than overwrite.');}catch(error){if(error.code!=='ENOENT')throw error;}}
await mkdir(target,{recursive:true});
for(const part of ['public','worker','db','drizzle','package.json','package-lock.json','README.md','README-先读我.md','交给WorkBuddy-部署任务.md','免费测试版上线说明.md','.env.example','.gitignore','.dockerignore','Dockerfile','THIRD_PARTY_NOTICES.md','LIVE-SOURCE-SNAPSHOT.json','验收报告.md'])await cp(path.join(root,part),path.join(target,part),{recursive:true,filter:source=>!(/\.mp4\.sb-/.test(path.basename(source)))});
await mkdir(path.join(target,'scripts'));
for(const n of await readdir(path.join(root,'scripts')))if(/^check.*\.mjs$/.test(n)||['build.mjs','serve.mjs','media-assets.mjs','package-release.mjs','export-brand.swift','qwen-test-image.swift','prepare-promo.swift','optimize-web-video.swift'].includes(n))await cp(path.join(root,'scripts',n),path.join(target,'scripts',n));
await cp(path.join(root,'dist/server'),path.join(target,'dist/server'),{recursive:true});
const sums=[];
async function scan(dir){for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory()){await scan(file);continue;}if(!entry.isFile())throw new Error('Unexpected symlink in release.');const bytes=await readFile(file);if(/\.(js|mjs|ts|json|html|css|md|env|txt|sql|example|src|py|swift)$/.test(entry.name)&&/sk-[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(bytes.toString('utf8')))throw new Error('Potential secret: refusing to package.');sums.push(createHash('sha256').update(bytes).digest('hex')+'  '+path.relative(target,file).split(path.sep).join('/'));}}
await scan(target);await writeFile(path.join(target,'文件清单.sha256'),sums.join('\n')+'\n');
const result=spawnSync('zip',['-q','-r',archive,name],{cwd:output});if(result.status!==0)throw new Error('Archive creation failed.');
const zipped=await readFile(archive);await writeFile(archive+'.sha256',createHash('sha256').update(zipped).digest('hex')+'  '+path.basename(archive)+'\n');
console.log(JSON.stringify({archive,files:sums.length,bytes:zipped.length,secretScan:'PASS',excluded:'credentials, database, user data, node_modules, hosting identity'}));
