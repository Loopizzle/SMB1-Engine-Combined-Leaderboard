import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourcePath = join('public', 'site-data.json');
const outputDir = join('public', 'data');
const chunkSize = 700_000;

if (!existsSync(sourcePath)) {
  process.exit(0);
}

const source = await readFile(sourcePath, 'utf8');
const payload = JSON.parse(source);
await mkdir(outputDir, { recursive: true });

for (const file of await readdir(outputDir)) {
  if (file.startsWith('site-data-')) {
    await rm(join(outputDir, file));
  }
}

const parts = [];
for (let start = 0, index = 0; start < source.length; index += 1) {
  let end = Math.min(start + chunkSize, source.length);
  const lastCodeUnit = source.charCodeAt(end - 1);
  if (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff) {
    end -= 1;
  }

  const filename = `site-data-${String(index).padStart(3, '0')}.json.part`;
  await writeFile(join(outputDir, filename), source.slice(start, end), 'utf8');
  parts.push(filename);
  start = end;
}

await writeFile(
  join(outputDir, 'site-data-manifest.json'),
  `${JSON.stringify({ parts }, null, 2)}\n`,
  'utf8',
);

const csvColumns = Object.keys(payload.combined?.[0] || {}).filter((column) => column !== 'Flag URL');
const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = [
  csvColumns.map(csvCell).join(','),
  ...(payload.combined || []).map((row) => csvColumns.map((column) => csvCell(row[column])).join(',')),
].join('\n');
await writeFile(join('public', 'combined-leaderboard.csv'), `${csv}\n`, 'utf8');
