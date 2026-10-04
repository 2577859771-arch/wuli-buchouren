/* 物理实验 3D 共享脚本（依赖全局 THREE r128 + THREE.OrbitControls） */
(function(){
'use strict';
const LIB_BASE = document.currentScript ? new URL('.', document.currentScript.src).href : '../lib/';
const Lab = window.Lab = {};

/* ---------- 主题 ---------- */
Lab.css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
Lab.col = n => new THREE.Color(Lab.css(n) || '#888888');
const themeHooks = [];
Lab.onTheme = fn => { themeHooks.push(fn); };
Lab.refreshTheme = () => themeHooks.forEach(f => { try{ f(); }catch(e){ console.error(e); } });
const qTheme = new URLSearchParams(location.search).get('theme');
if (qTheme === 'dark' || qTheme === 'light') document.documentElement.dataset.theme = qTheme;
try{ matchMedia('(prefers-color-scheme: dark)').addEventListener('change', Lab.refreshTheme); }catch(e){}
// 父页面可用 postMessage({type:'lab-theme', theme:'dark'|'light'|'auto'}) 切换主题
window.addEventListener('message', e => {
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const d = e.data;
  if (d && d.type === 'lab-theme' && ['dark','light','auto'].includes(d.theme)){
    if (d.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = d.theme;
    Lab.refreshTheme();
  }
});

/* 主题化材质：颜色随 CSS 变量更新 */
Lab.themed = function(material, varName){
  material.color = Lab.col(varName);
  Lab.onTheme(() => { material.color = Lab.col(varName); });
  return material;
};
Lab.std = (v, o) => Lab.themed(new THREE.MeshStandardMaterial(Object.assign({roughness:0.55}, o||{})), v);
Lab.basic = (v, o) => Lab.themed(new THREE.MeshBasicMaterial(o||{}), v);
Lab.lineMat = (v, o) => Lab.themed(new THREE.LineBasicMaterial(o||{}), v);
Lab.dashMat = (v, o) => Lab.themed(new THREE.LineDashedMaterial(Object.assign({dashSize:0.1, gapSize:0.07}, o||{})), v);

/* ---------- 场景 ---------- */
Lab.createStage = function(canvas){
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 400);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.65);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008;
  scene.add(sun); scene.add(sun.target);
  const apply = () => { scene.background = Lab.col('--scene'); hemi.groundColor = Lab.col('--scene'); };
  apply(); Lab.onTheme(apply);

  const frameFns = [];
  let home = null;
  const stage = {
    renderer, scene, camera, controls, sun, hemi,
    onFrame(fn){ frameFns.push(fn); },
    /* 正上方平行光：阴影即竖直正投影 */
    overheadLight(cx, cz, half, top){
      sun.position.set(cx, top + 30, cz); sun.target.position.set(cx, 0, cz);
      const c = sun.shadow.camera; c.left = -half; c.right = half; c.top = half; c.bottom = -half;
      c.near = 1; c.far = top + 60; c.updateProjectionMatrix();
    },
    setHome(target, pos){ home = {t:target.clone(), p:pos.clone()}; stage.goHome(); },
    goHome(){ if (!home) return; controls.target.copy(home.t); camera.position.copy(home.p); controls.update(); }
  };
  function resize(){
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas.parentElement); resize();
  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    for (const f of frameFns) f(dt);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return stage;
};

/* ---------- 文字标签（Sprite） ---------- */
Lab.label = function(text, varName, height){
  const h = height || 0.42;
  const c = document.createElement('canvas'); c.height = 96;
  const ctx = c.getContext('2d');
  const font = '500 44px "Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  ctx.font = font; c.width = Math.ceil(ctx.measureText(text).width + 16);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, depthWrite:false}));
  s.center.set(0, 0.5); s.scale.set(h * c.width / 96, h, 1);
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height); ctx.font = font;
    ctx.fillStyle = Lab.css(varName); ctx.textBaseline = 'middle'; ctx.fillText(text, 8, 50);
    tex.needsUpdate = true;
  };
  draw(); Lab.onTheme(draw);
  return s;
};

/* ---------- 网格 ---------- */
let gridMat = null;
Lab.grid = function(w, h, step){
  if (!gridMat) gridMat = Lab.lineMat('--line', {transparent:true, opacity:0.9});
  const pts = [];
  for (let x = 0; x <= w + 1e-6; x += step) pts.push(x,0,0, x,h,0);
  for (let y = 0; y <= h + 1e-6; y += step) pts.push(0,y,0, w,y,0);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(g, gridMat);
};

/* ---------- 矢量箭头 ---------- */
Lab.arrow = function(varName, head){
  const hl = head || 0.12;
  const a = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(), 1, 0x000000, hl, hl*0.6);
  const paint = () => a.setColor(Lab.col(varName)); paint(); Lab.onTheme(paint);
  a.show = function(origin, vec, scale, on){
    const len = vec.length() * (scale || 1);
    a.visible = (on !== false) && len > 1e-3;
    if (!a.visible) return;
    a.position.copy(origin); a.setDirection(vec.clone().normalize());
    const hh = Math.min(hl, len * 0.45); a.setLength(len, hh, hh * 0.6);
  };
  return a;
};

/* ---------- 滑块 ---------- */
Lab.range = function(id, fmt, onInput){
  const el = document.getElementById(id), out = document.getElementById(id + 'o');
  const get = () => parseFloat(el.value);
  const upd = () => { if (out) out.textContent = fmt(get()); };
  el.addEventListener('input', () => { upd(); onInput && onInput(get()); });
  upd();
  return {get, set(v){ el.value = v; upd(); onInput && onInput(get()); }, el};
};

/* ---------- 2D 折线图 ---------- */
Lab.Chart = function(canvas, opts){
  const o = Object.assign({xLabel:'t / s', yLabel:'', series:[], symmetric:false}, opts);
  const ctx = canvas.getContext('2d');
  const data = o.series.map(() => []);
  let xMax = o.xMax || 5, xMin = o.xMin || 0, yMin = 0, yMax = 1, fixedY = o.yRange || null;
  const self = {
    clear(){ data.forEach(d => d.length = 0); },
    push(i, x, y){ data[i].push(x, y); },
    setXMax(v){ xMax = v; },
    setXRange(a, b){ xMin = a; xMax = b; },
    setYRange(a, b){ fixedY = [a, b]; },
    draw(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== Math.round(W*dpr)){ canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr); }
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
      // 范围
      let x1 = xMax;
      data.forEach(d => { for (let k=0;k<d.length;k+=2) if (d[k] > x1) x1 = d[k]; });
      if (fixedY){ yMin = fixedY[0]; yMax = fixedY[1]; }
      else {
        let lo = Infinity, hi = -Infinity;
        data.forEach(d => { for (let k=1;k<d.length;k+=2){ if (d[k]<lo) lo=d[k]; if (d[k]>hi) hi=d[k]; } });
        if (!isFinite(lo)){ lo = -1; hi = 1; }
        if (o.symmetric){ const m = Math.max(Math.abs(lo), Math.abs(hi), 1e-6); lo = -m; hi = m; }
        if (hi - lo < 1e-6){ hi += 0.5; lo -= 0.5; }
        const pad = (hi-lo)*0.08; yMin = lo - pad; yMax = hi + pad;
      }
      const L = 40, R = 10, T = 10, B = 22;
      const sx = x => L + ((x - xMin) / (x1 - xMin)) * (W - L - R);
      const sy = y => T + (1 - (y - yMin) / (yMax - yMin)) * (H - T - B);
      ctx.font = '11px "Noto Sans SC",sans-serif'; ctx.fillStyle = Lab.css('--ink-2');
      ctx.strokeStyle = Lab.css('--line'); ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i=0;i<=4;i++){ const y = yMin + (yMax-yMin)*i/4, py = sy(y); ctx.moveTo(L,py); ctx.lineTo(W-R,py);
        ctx.fillText(Math.abs(y) < 1e-9 ? '0' : (Math.abs(y) >= 100 ? y.toFixed(0) : y.toFixed(Math.abs(y)>=10?1:2)), 2, py+4); }
      ctx.stroke();
      if (yMin < 0 && yMax > 0){ ctx.strokeStyle = Lab.css('--ink-2'); ctx.beginPath(); ctx.moveTo(L, sy(0)); ctx.lineTo(W-R, sy(0)); ctx.stroke(); }
      ctx.fillStyle = Lab.css('--ink-2');
      ctx.fillText(o.xLabel, W - R - ctx.measureText(o.xLabel).width, H - 6);
      ctx.fillText(xMin === 0 ? '0' : xMin.toFixed(1), L, H - 6);
      ctx.fillText(((xMin + x1)/2).toFixed(1), (L + W - R)/2 - 8, H - 6);
      o.series.forEach((s, i) => {
        const d = data[i]; if (d.length < 4) return;
        ctx.strokeStyle = Lab.css(s.color); ctx.lineWidth = s.width || 1.6;
        ctx.setLineDash(s.dash ? [5,4] : []);
        ctx.beginPath(); ctx.moveTo(sx(d[0]), sy(d[1]));
        for (let k=2;k<d.length;k+=2) ctx.lineTo(sx(d[k]), sy(d[k+1]));
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }
  };
  Lab.onTheme(self.draw);
  new ResizeObserver(() => self.draw()).observe(canvas);
  return self;
};

/* ---------- 数值工具 ---------- */
Lab.rk4 = function(y, f, h){
  const n = y.length, k1 = f(y), t = new Array(n);
  for (let i=0;i<n;i++) t[i] = y[i] + h/2*k1[i];
  const k2 = f(t); for (let i=0;i<n;i++) t[i] = y[i] + h/2*k2[i];
  const k3 = f(t); for (let i=0;i<n;i++) t[i] = y[i] + h*k3[i];
  const k4 = f(t);
  for (let i=0;i<n;i++) y[i] += h/6*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]);
  return y;
};
Lab.relErr = (theory, sim) => {
  if (!isFinite(theory) || !isFinite(sim) || Math.abs(theory) < 1e-9) return '—';
  const e = Math.abs(sim - theory) / Math.abs(theory) * 100;
  return e < 0.001 ? '<0.001%' : e.toFixed(3) + '%';
};
Lab.f = (n, d) => (Math.abs(n) < 0.5 * Math.pow(10, -(d==null?3:d)) ? 0 : n).toFixed(d==null?3:d);

/* ---------- Rapier 加载：本地 → 明确标注的算法回退 ---------- */
Lab.loadRapier = async function(){
  const urls = [LIB_BASE + 'rapier/rapier.es.js'];
  for (const u of urls){
    try{ const m = await import(u); const R = m.default || m; await R.init(); return R; }
    catch(e){ console.warn('Rapier 加载失败：', u, e); }
  }
  return null;
};
Lab.badge = function(el, text, ok){ el.textContent = text; el.className = 'engine ' + (ok ? 'ok' : 'fb'); };

/* 固定步长驱动器：把真实时间 × 倍速 切成 DT 小步 */
Lab.stepper = function(DT, stepFn){
  let acc = 0;
  return function(realDt, speed){
    acc += realDt * speed; let n = 0;
    while (acc >= DT && n < 4000){ if (stepFn() === false){ acc = 0; break; } acc -= DT; n++; }
    return n;
  };
};
})();

/* ---------- 追加工具（第二批实验） ---------- */
(function(){
const Lab = window.Lab;
/* 阴影开关 */
Lab.bindShadow = function(stage, id){
  const el = document.getElementById(id); if (!el) return;
  el.addEventListener('change', () => {
    stage.renderer.shadowMap.enabled = el.checked;
    stage.scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
  });
};
/* 播放 / 暂停 / 结束 按钮状态机 */
Lab.player = function(btn, labels){
  const L = Object.assign({idle:'开始', run:'暂停', pause:'继续', done:'再来一次'}, labels || {});
  const st = {phase:'idle', onStart:null, onRestart:null};
  st.set = p => { st.phase = p; btn.textContent = L[p]; };
  btn.addEventListener('click', () => {
    if (st.phase === 'done'){ st.onRestart && st.onRestart(); st.set('idle'); }
    if (st.phase === 'idle'){ st.onStart && st.onStart(); st.set('run'); }
    else if (st.phase === 'run') st.set('pause');
    else if (st.phase === 'pause') st.set('run');
  });
  st.set('idle');
  return st;
};
/* 波长 → RGB（380–780 nm，近似） */
Lab.waveColor = function(nm){
  let r=0,g=0,b=0;
  if (nm<440){ r=-(nm-440)/60; b=1; } else if (nm<490){ g=(nm-440)/50; b=1; }
  else if (nm<510){ g=1; b=-(nm-510)/20; } else if (nm<580){ r=(nm-510)/70; g=1; }
  else if (nm<645){ r=1; g=-(nm-645)/65; } else r=1;
  let f = nm<420 ? 0.3+0.7*(nm-380)/40 : nm>700 ? 0.3+0.7*(780-nm)/80 : 1;
  return new THREE.Color(Math.pow(r*f,0.8), Math.pow(g*f,0.8), Math.pow(b*f,0.8));
};
/* 粗光线（圆柱），可更新两端 */
Lab.beam = function(color, radius){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius||0.012, radius||0.012, 1, 10, 1, true),
    new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.95}));
  m.setEnds = function(a, b){
    const d = b.clone().sub(a), len = d.length();
    m.visible = len > 1e-6; if (!m.visible) return;
    m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.normalize());
  };
  return m;
};
/* 可更新的折线 */
Lab.polyline = function(material, max){
  const l = new THREE.Line(new THREE.BufferGeometry(), material);
  l.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(max*3), 3));
  l.geometry.setDrawRange(0, 0); l.max = max; l.count = 0;
  l.push = function(p){
    const a = l.geometry.attributes.position.array;
    if (l.count < l.max){ a[l.count*3]=p.x; a[l.count*3+1]=p.y; a[l.count*3+2]=p.z; l.count++; }
    else { a.copyWithin(0, 3); a[(l.max-1)*3]=p.x; a[(l.max-1)*3+1]=p.y; a[(l.max-1)*3+2]=p.z; }
    l.geometry.setDrawRange(0, l.count); l.geometry.attributes.position.needsUpdate = true; l.geometry.computeBoundingSphere();
  };
  l.setPoints = function(pts){
    const a = l.geometry.attributes.position.array, n = Math.min(pts.length, l.max);
    for (let i=0;i<n;i++){ a[i*3]=pts[i].x; a[i*3+1]=pts[i].y; a[i*3+2]=pts[i].z; }
    l.count = n; l.geometry.setDrawRange(0, n); l.geometry.attributes.position.needsUpdate = true; l.geometry.computeBoundingSphere();
    if (l.material.isLineDashedMaterial) l.computeLineDistances();
  };
  l.clear = function(){ l.count = 0; l.geometry.setDrawRange(0, 0); };
  return l;
};
/* 地面 + 网格 */
Lab.floor = function(scene, w, d, y){
  const f = new THREE.Mesh(new THREE.PlaneGeometry(w, d), Lab.std('--wall', {roughness:1}));
  f.rotation.x = -Math.PI/2; f.position.y = y || 0; f.receiveShadow = true; scene.add(f);
  const g = Lab.grid(Math.floor(w*0.7), Math.floor(d*0.7), 0.5); g.rotation.x = -Math.PI/2;
  g.position.set(-Math.floor(w*0.7)/2, (y||0)+0.002, Math.floor(d*0.7)/2); scene.add(g);
  return f;
};
Lab.text = (id, s) => { const e = document.getElementById(id); if (e) e.textContent = s; };
Lab.html = (id, s) => { const e = document.getElementById(id); if (e) e.innerHTML = s; };
})();
