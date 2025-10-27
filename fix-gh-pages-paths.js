// fix-gh-pages-paths.js
const fs = require('fs');
const path = require('path');

const repo = 'RDR2'; // <- MUST match your repo name exactly
const root = path.resolve(__dirname, 'docs');

function walkAndRewrite() {
  const exts = new Set(['.html', '.js', '.json', '.css']);
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) { walk(p); continue; }
      if (!exts.has(path.extname(ent.name).toLowerCase())) continue;

      let txt = fs.readFileSync(p, 'utf8');

      // Prefix absolute assets/scripts with /REPO/
      txt = txt.replace(/"\/_expo\//g, `"/${repo}/_expo/`)
               .replace(/"\/assets\//g, `"/${repo}/assets/`)
               .replace(/"start_url"\s*:\s*"\/"/g, `"start_url": "/${repo}/"`)
               .replace(/"scope"\s*:\s*"\/"/g, `"scope": "/${repo}/"`);

      // Remove any existing <base> and inject the correct one
      txt = txt.replace(/<base[^>]*>/g, '');
      txt = txt.replace('<head>', `<head><base href="/${repo}/">`);

      fs.writeFileSync(p, txt, 'utf8');
    }
  }
  walk(root);
}

function fixIndexHash() {
  const webDir = path.join(root, '_expo', 'static', 'js', 'web');
  if (!fs.existsSync(webDir)) return;

  const files = fs.readdirSync(webDir).filter(f => /^index-.*\.js$/.test(f));
  if (files.length === 0) return;
  const actual = files[0]; // e.g. index-abc123.js
  const expectedPattern = /\/[A-Za-z0-9_-]+\/_expo\/static\/js\/web\/index-[0-9a-f]+\.js/g;

  const idxPath = path.join(root, 'index.html');
  if (!fs.existsSync(idxPath)) return;

  let idx = fs.readFileSync(idxPath, 'utf8');
  // Ensure path is under /repo/
  const correct = `/${repo}/_expo/static/js/web/${actual}`;
  idx = idx.replace(expectedPattern, correct);
  // Also handle any non-hash variant
  idx = idx.replace(/\/_expo\/static\/js\/web\/index-[^"]+\.js/g, correct)
           .replace(/\/_expo\/static\/js\/web\/index\.js/g, correct)
           .replace(/\/[A-Za-z0-9_-]+\/_expo\/static\/js\/web\/index\.js/g, correct);

  fs.writeFileSync(idxPath, idx, 'utf8');

  // SPA fallback
  fs.copyFileSync(idxPath, path.join(root, '404.html'));
}

if (!fs.existsSync(root)) {
  console.error('docs/ not found. Run: npx expo export -p web --output-dir docs');
  process.exit(1);
}

walkAndRewrite();
fixIndexHash();
console.log('✅ Rewrote paths, fixed index bundle hash, added 404.html');
