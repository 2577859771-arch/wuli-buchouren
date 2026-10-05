// Read-only deployment smoke check. Does not call models, send mail or create accounts.
const target=new URL(process.argv[2]||'http://localhost:4178');
if(target.username||target.password||target.search||target.hash||target.pathname!=='/')throw new Error('Provide only the site origin, without credentials or path.');
if(target.protocol!=='https:'&&!(target.protocol==='http:'&&['localhost','127.0.0.1'].includes(target.hostname)))throw new Error('Public deployments must use HTTPS.');
const checks=[];
async function get(route,headers={}){return fetch(new URL(route,target),{headers,redirect:'error',signal:AbortSignal.timeout(15000)});}
const health=await get('/api/health');const status=await health.json();checks.push({name:'database health',ok:health.status===200&&status.status==='ok'&&status.database==='ok'});
const home=await get('/');checks.push({name:'free beta homepage',ok:home.status===200&&(await home.text()).includes('免费测试版 · BETA')});
const session=await get('/api/session');const account=await session.json();checks.push({name:'anonymous session and quota',ok:session.status===200&&account.user===null&&Number.isInteger(account.aiQuota?.dailyLimit)});
for(const route of ['/lab3d.html','/physics-lab/index.html','/math-foundations.js']){const response=await get(route);checks.push({name:route,ok:response.status===200});await response.body?.cancel();}
const video=await get('/media/physics-promo-v2-stream.mp4',{Range:'bytes=0-1023'});const range=video.headers.get('content-range');checks.push({name:'video seek',ok:video.status===206&&/^bytes 0-1023\/\d+$/.test(range||'')});await video.body?.cancel();
console.log(JSON.stringify({origin:target.origin,checks,configuration:{ai:status.aiConfigured,vision:status.visionConfigured,mail:status.mailConfigured},notice:'Configuration is not live model/email validation. This machine cannot prove mainland mobile reachability.'},null,2));
if(checks.some(check=>!check.ok))process.exitCode=1;
