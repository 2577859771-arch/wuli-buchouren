// Secrets and email links are server-only. Tokens are random, hashed, expiring,
// single-use, and never returned to the browser or written to application logs.
export function mailConfiguration(env) {
  let origin;
  try { const url=new URL(env.PUBLIC_ORIGIN); if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/') origin=url.origin; } catch {}
  return {ready:!!(env.MAIL_API_KEY&&env.MAIL_FROM&&origin),origin};
}
function escapeHTML(text) { return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export async function sendAccountEmail(env, email, kind, token) {
  const config=mailConfiguration(env);
  if(!config.ready) throw new Error('MAIL_NOT_CONFIGURED');
  const link=new URL(config.origin);
  link.searchParams.set('auth',kind==='reset'?'reset':'verify');
  link.searchParams.set('token',token);
  link.hash='home';
  const title=kind==='reset'?'重设你的密码':'验证你的邮箱';
  const interval=kind==='reset'?'30 分钟':'24 小时';
  const endpoint=new URL(env.MAIL_API_URL||'https://api.resend.com/emails');
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password) throw new Error('INVALID_MAIL_ENDPOINT');
  const response=await fetch(endpoint,{method:'POST',redirect:'manual',headers:{'content-type':'application/json',authorization:'Bearer '+env.MAIL_API_KEY,'idempotency-key':'physics-'+kind+'-'+token.slice(0,32)},body:JSON.stringify({from:env.MAIL_FROM,to:[email],subject:'物理不愁人 · '+title,html:`<div style="font-family:system-ui;max-width:560px;margin:auto;padding:32px;color:#183c34"><h1>物理不愁人</h1><h2>${title}</h2><p>请点击下方链接，完成操作。链接在 ${interval}内有效，且只能使用一次。</p><p><a href="${escapeHTML(link.href)}" style="display:inline-block;background:#176b54;color:white;padding:14px 24px;border-radius:12px;text-decoration:none">${title}</a></p><p>如果不是你本人发起，请忽略这封邮件。请勿把链接转发给他人。</p></div>`}),signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error('MAIL_DELIVERY_FAILED');
}
export async function issueAccountToken(env, record, kind, helpers) {
  const token=helpers.random(), now=Date.now(), ttl=kind==='reset'?1800000:86400000;
  const hash=await helpers.digest(token);
  // Persist before delivery so even an immediately opened link is usable.
  // Failed delivery removes only this token, preserving previous valid links.
  await helpers.db(env).prepare('INSERT INTO auth_tokens (token_hash,user_id,kind,expires_at) VALUES (?,?,?,?)').bind(hash,record.id,kind,now+ttl).run();
  try{await sendAccountEmail(env,record.email,kind,token);}catch(error){await helpers.db(env).prepare('DELETE FROM auth_tokens WHERE token_hash=?').bind(hash).run();throw error;}
  await helpers.db(env).prepare('DELETE FROM auth_tokens WHERE user_id=? AND kind=? AND token_hash<>?').bind(record.id,kind,hash).run();
}
export async function accountMailAPI(context) {
  const {path,request,env,body,ip,json,db,digest,random,passwordHash,limited,user}=context;
  if(!['/api/forgot-password','/api/reset-password','/api/send-verification','/api/verify-email'].includes(path)) return null;
  const email=String(body.email||'').trim().toLowerCase();
  if(path==='/api/forgot-password'||path==='/api/send-verification') {
    if(!mailConfiguration(env).ready) return json({error:'邮件服务尚未配置。暂时无法发送验证或找回邮件，请联系网站管理员。',code:'MAIL_NOT_CONFIGURED'},503);
    if(!await limited(env,'mail-ip:'+ip,5,3600000)||!await limited(env,'mail-global',100,86400000)) return json({error:'发送请求过于频繁，请稍后重试。'},429);
    let record;
    if(path==='/api/send-verification') {
      record=await user(request,env);
      if(!record) return json({error:'请先登录，再验证邮箱。',code:'LOGIN_REQUIRED'},401);
      if(record.emailVerified) return json({ok:true,message:'你的邮箱已经验证。'});
    } else {
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254) return json({error:'请填写有效邮箱。'},400);
      if(!await limited(env,'mail-address:'+await digest(email),3,3600000)) return json({error:'发送请求过于频繁，请稍后重试。'},429);
      record=await db(env).prepare('SELECT id,email FROM users WHERE email=?').bind(email).first();
    }
    if(record) {
      try { await issueAccountToken(env,record,path==='/api/forgot-password'?'reset':'verify',context); }
      catch { return json({error:'邮件暂时无法送达，请稍后重试。',code:'MAIL_DELIVERY_FAILED'},502); }
    }
    return json({ok:true,message:path==='/api/forgot-password'?'若该邮箱已注册，你会收到重设密码的邮件。请检查收件箱及垃圾邮件。':'验证邮件已发送，请检查收件箱及垃圾邮件。'});
  }
  if(!await limited(env,'token-ip:'+ip,15,3600000)) return json({error:'操作过于频繁，请稍后重试。'},429);
  const token=String(body.token||'');
  if(!/^[a-f0-9]{64}$/.test(token)) return json({error:'链接无效或已过期，请重新申请。'},400);
  const reset=path==='/api/reset-password';
  let salt,hash;
  if(reset) {
    const password=body.password;
    if(typeof password!=='string'||password.length<10||password.length>128) return json({error:'密码需为 10–128 个字符。'},400);
    salt=random(); hash=await passwordHash(password,salt);
  }
  const claim=await db(env).prepare('UPDATE auth_tokens SET used_at=? WHERE token_hash=? AND kind=? AND used_at IS NULL AND expires_at>? RETURNING user_id').bind(Date.now(),await digest(token),reset?'reset':'verify',Date.now()).first();
  if(!claim) return json({error:'链接无效、已使用或已过期，请重新申请。'},400);
  if(reset) {
    await db(env).prepare('UPDATE users SET password_hash=?,salt=? WHERE id=?').bind(hash,salt,claim.user_id).run();
    await db(env).prepare('DELETE FROM sessions WHERE user_id=?').bind(claim.user_id).run();
    await db(env).prepare('DELETE FROM auth_tokens WHERE user_id=? AND kind=?').bind(claim.user_id,'reset').run();
    return json({ok:true,message:'密码已更新，其他设备的登录已失效。请使用新密码登录。'},200,{'set-cookie':'__Host-physics_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});
  }
  await db(env).prepare('UPDATE users SET email_verified_at=? WHERE id=?').bind(Date.now(),claim.user_id).run();
  return json({ok:true,message:'邮箱已验证，你可以继续学习。'});
}
