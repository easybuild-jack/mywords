// 把 public/dicts/basewords.json 中 design/docs/baseword.json 没有的单词追加进去（重复的跳过）
// 用法：node scripts/merge-basewords-into-baseword.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const targetFile = path.join(root, 'design/docs/baseword.json');
const sourceFile = path.join(root, 'public/dicts/basewords.json');
const dryRun = process.argv.includes('--dry-run');

const target = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
const source = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

// 严格重复：name 完全一致；近似重复：忽略大小写、空格、连字符后一致（如 stomach ache / stomachache）
const normalize = (n) => n.toLowerCase().replace(/[\s-]+/g, '');
const exact = new Set(target.map((w) => w.name));
const loose = new Map(target.map((w) => [normalize(w.name), w.name]));

const added = [];
const nearDup = [];
let exactDup = 0;
for (const w of source) {
  if (exact.has(w.name)) { exactDup++; continue; }
  const hit = loose.get(normalize(w.name));
  if (hit) { nearDup.push(`${w.name} ≈ ${hit}`); continue; }
  target.push(w);
  exact.add(w.name);
  loose.set(normalize(w.name), w.name);
  added.push(w.name);
}

console.log(`源 ${source.length} 词：已存在 ${exactDup}，近似重复跳过 ${nearDup.length}，新增 ${added.length}`);
if (nearDup.length) console.log('近似重复（未加入）:', nearDup.join('；'));
if (added.length) console.log('新增:', added.join(', '));

if (dryRun) {
  console.log('（--dry-run，未写入）');
} else if (added.length) {
  fs.writeFileSync(targetFile, JSON.stringify(target, null, 2) + '\n');
  console.log(`已写入 ${path.relative(root, targetFile)}，共 ${target.length} 词`);
} else {
  console.log('无需写入');
}
