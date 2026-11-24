import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Load classic script data module in a sandboxed context (works identically to file:// and http://)
const sandbox = { globalThis: {}, Date, Math };
sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data/chapters.js'), 'utf8'), sandbox);
const { CHAPTERS, MEMORIES, calcDays, nextSpecialDate } = sandbox.Pacu;

// 1. Date & data invariants
assert.equal(CHAPTERS.length, 8, 'Expected 8 chapters');
assert.ok(calcDays(new Date(2026, 10, 23)) >= 730, 'Days since Nov 23, 2024 should be >= 730');
const nextAfterAnni = nextSpecialDate(new Date(2026, 10, 24));
assert.equal(nextAfterAnni.name, 'San Valentín');
assert.ok(nextAfterAnni.days > 0);

// 2. Every referenced asset and local module exists, and no ES module script tags block file:// opening
assert.ok(!/<script[^>]+type=["']module["']/i.test(html), 'Classic <script defer> is required for file:// compatibility');
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)=["']((?:assets|css|js)\/[^"'?]+)/g)) refs.add(m[1]);
for (const list of Object.values(MEMORIES)) {
  for (const item of list) refs.add(item.src);
}
for (const rel of refs) {
  assert.ok(fs.existsSync(path.join(root, rel)), `Missing file: ${rel}`);
}

// 3. No duplicate IDs in index.html
const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
assert.deepEqual(dupes, [], `Duplicate IDs found: ${dupes.join(', ')}`);

// 4. Local HTTP serving smoke test
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.m4a': 'audio/mp4',
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const full = path.resolve(root, rel);
  if (!full.startsWith(root) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
try {
  for (const p of ['', 'css/style.css', 'js/main.js', 'js/data/chapters.js', 'js/core/gallery.js', 'js/core/scene.js']) {
    const res = await fetch(`http://127.0.0.1:${port}/${p}`);
    assert.equal(res.status, 200, `Expected 200 for /${p}`);
  }
  console.log(`verify.mjs: all checks passed (${refs.size} files verified, ${ids.length} unique IDs).`);
} finally {
  server.close();
}
