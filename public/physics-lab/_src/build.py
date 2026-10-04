import re, sys, glob, os
TPL = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · 物理实验 3D</title>
<link rel="stylesheet" href="../lib/lab.css">
{style}</head>
<body>
<div class="app">
  <div class="stage">
    <canvas id="c" class="view" aria-label="{title}三维场景，可拖动旋转、滚轮缩放"></canvas>
    <div class="title">
      <a href="../index.html">返回实验列表</a>
      <h1>{title}</h1>
      <p>{sub}</p>
      <span class="engine ok" id="engine">{badge}</span>
    </div>
    <div class="stage-tools"><button class="chip" id="fitBtn">复位视角</button></div>
    <div class="hud">
{hud}
    </div>
    <div class="legend">
{legend}
    </div>
  </div>
  <aside>
{aside}
  </aside>
</div>
<script src="../lib/three.min.js"></script>
<script src="../lib/OrbitControls.js"></script>
<script src="../lib/question-runtime.js"></script>
<script src="../lib/lab.js"></script>
<script src="../lib/question-loader.js"></script>
<script>
(function(){{
'use strict';
const $ = id => document.getElementById(id);
const stage = Lab.createStage($('c'));
const {{scene}} = stage;
$('fitBtn').addEventListener('click', () => stage.goHome());
Lab.bindShadow(stage, 'tShadow');
{script}
}})();
</script>
</body>
</html>
'''
def build(path, outdir):
  src = open(path, encoding='utf-8').read()
  parts = {}
  key = None; buf = []
  for line in src.split('\n'):
    m = re.match(r'^@(\w+)\s?(.*)$', line)
    if m:
      if key: parts[key] = '\n'.join(buf).strip('\n')
      key = m.group(1); buf = [m.group(2)] if m.group(2) else []
    else: buf.append(line)
  if key: parts[key] = '\n'.join(buf).strip('\n')
  parts.setdefault('style', '')
  if parts['style']: parts['style'] = '<style>\n' + parts['style'] + '\n</style>\n'
  html = TPL.format(**parts)
  name = os.path.splitext(os.path.basename(path))[0]
  open(os.path.join(outdir, name + '.html'), 'w', encoding='utf-8').write(html)
  return name
if __name__ == '__main__':
  out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'experiments')
  for p in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '*.src'))) if len(sys.argv) < 2 else sys.argv[1:]:
    print('built', build(p, out))
