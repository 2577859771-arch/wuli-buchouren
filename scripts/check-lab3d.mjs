import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import worker from '../dist/server/index.js';
import {labExperiments} from '../public/lab3d-registry.js';

const experiments = labExperiments.map(lab=>lab.id);
assert.equal(experiments.length,18);
const paths = ['/lab3d.html', '/lab3d.js', '/lab3d-registry.js', '/lab3d.css', '/lab3d-entry.js', '/physics-lab/', '/physics-lab/index.html', ...experiments.map(id => `/physics-lab/experiments/${id}.html`), '/physics-lab/lib/lab.css', '/physics-lab/lib/lab.js', '/physics-lab/lib/three.min.js', '/physics-lab/lib/OrbitControls.js', '/physics-lab/lib/rapier/rapier.es.js'];
for (const path of paths) {
  const r = await worker.fetch(new Request('https://test.example' + path), {});
  assert.equal(r.status, 200, path);
  assert(Number(r.headers.get('content-length') || 1) > 0);
  if (path.endsWith('.js')) assert.match(r.headers.get('content-type'), /javascript/);
  if (path.startsWith('/physics-lab/')) {
    assert.match(r.headers.get('content-security-policy'), /'wasm-unsafe-eval'/);
    assert.match(r.headers.get('content-security-policy'), /script-src 'self' 'unsafe-inline'/);
  } else {
    assert(!r.headers.get('content-security-policy').includes('wasm-unsafe-eval'));
  }
}
let r = await worker.fetch(new Request('https://test.example/physics-lab?theme=dark'), {});
assert.equal(r.status, 308);
assert.equal(r.headers.get('location'), '/physics-lab/?theme=dark');
r = await worker.fetch(new Request('https://test.example/'), {});
assert.match(r.headers.get('content-security-policy'), /script-src 'self';/);
assert((await r.text()).includes('lab3d-entry.js'));
r = await worker.fetch(new Request('https://test.example/physics-lab/experiments/projectile.html', { method: 'HEAD' }), {});
assert.equal(await r.text(), '');

// Optional archive argument: verify that EVERY original file was kept byte-for-byte.
if (process.argv[2]) {
  const archive = process.argv[2];
  async function originalFiles(directory, prefix = 'physics-lab') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const relative = `${prefix}/${entry.name}`;
      const local = `${directory}/${entry.name}`;
      if (entry.isDirectory()) { await originalFiles(local, relative); continue; }
      const original = spawnSync('unzip', ['-p', archive, relative], { maxBuffer: 8 * 1024 * 1024 });
      assert.equal(original.status, 0, relative);
      const hash = bytes => createHash('sha256').update(bytes).digest('hex');
      assert.equal(hash(await readFile(local)), hash(original.stdout), relative);
    }
  }
  await originalFiles('public/physics-lab');
}
const rapier = await import('../public/physics-lab/lib/rapier/rapier.es.js');
await rapier.default.init();
const world = new rapier.default.World({ x: 0, y: -9.8, z: 0 });
world.step();
world.free();
console.log('PASS: 18 experiments, static routes, relative libraries, route-scoped CSP, HEAD, directory redirect, embedded Rapier WASM.');
