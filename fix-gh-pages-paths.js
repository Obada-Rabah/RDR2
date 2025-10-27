// fix-gh-pages-paths.js
const fs = require('fs');
const path = require('path');

const repo = 'RDR2';                 // <<--- make sure this matches your repo name exactly
const root = path.resolve(__dirname, 'docs');

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (/\.(html|js|json|css)$/i.test(entry.name)) {
      let txt = fs.readFileSync(p, 'utf8');

      // rewrite absolute paths to live under /REPO/
      txt = txt
        .replace(/"\/_expo\//g, `"/${repo}/_expo/`)
        .replace(/"\/assets\//g, `"/${repo}/assets/`)
        .replace(/"start_url"\s*:\s*"\/"/g, `"start_url": "/${repo}/"`)
        .replace(/"scope"\s*:\s*"\/"/g, `"scope": "/${repo}/"`);

      // ensure exactly one correct <base> tag
      txt = txt.replace(/<base[^>]*>/g, '');
      txt = txt.replace('<head>', `<head><base href="/${repo}/">`);

      fs.writeFileSync(p, txt, 'utf8');
    }
  }
}

if (!fs.existsSync(root)) {
  console.error('docs/ not found. Run `npx expo export -p web --output-dir docs` first.');
  process.exit(1);
}

walk(root);

// SPA fallback
fs.copyFileSync(path.join(root, 'index.html'), path.join(root, '404.html'));
console.log('✅ Rewrote paths for GitHub Pages and added 404.html');
