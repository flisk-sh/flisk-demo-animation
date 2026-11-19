import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = readFileSync(`${root}index.html`, 'utf8');
const meta = (pattern, label) => {
  const match = pattern.exec(html);
  assert.ok(match, `${label} is missing from index.html`);
  return match[1];
};

const description = meta(/<meta name="description" content="([^"]+)">/, 'meta description');
assert.ok(description.length > 0 && description.length < 160, `description is ${description.length} characters`);
for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
  const value = meta(new RegExp(`<meta property="${property}" content="([^"]+)">`), property);
  assert.ok(value.length > 0, `${property} is empty`);
}
assert.match(meta(/<link rel="canonical" href="([^"]+)">/, 'canonical link'), /^https:\/\//);
assert.match(meta(/<link rel="icon" href="([^"]+)"/, 'icon link'), /^https:\/\//);

const image = `${root}og.png`;
const bytes = readFileSync(image);
assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'og.png is not a PNG');
assert.ok(statSync(image).size < 200_000, 'og.png is too large for a share card');
console.log(`share-card metadata OK (description ${description.length} chars, og.png ${bytes.length} bytes)`);
