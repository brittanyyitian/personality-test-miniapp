const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const mini = path.join(root, 'miniprogram');
const app = JSON.parse(fs.readFileSync(path.join(mini, 'app.json'), 'utf8'));
const errors = [];

for (const page of app.pages) {
  for (const extension of ['.js', '.json', '.wxml', '.wxss']) {
    const file = path.join(mini, `${page}${extension}`);
    if (!fs.existsSync(file)) errors.push(`缺少页面文件：${file}`);
  }
}

for (const asset of ['hero-blue.png', 'mist-blue.png', 'mist-coral.png', 'mist-green.png', 'mist-lavender.png']) {
  const file = path.join(mini, 'assets', asset);
  if (!fs.existsSync(file) || fs.statSync(file).size < 1000) errors.push(`资源不可用：${file}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const packageBytes = walk(mini).reduce((sum, file) => sum + fs.statSync(file).size, 0);
if (packageBytes > 2 * 1024 * 1024) errors.push(`主包超过 2MB：${packageBytes} bytes`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`静态检查通过：${app.pages.length} 个页面，主包 ${(packageBytes / 1024 / 1024).toFixed(2)} MB`);
