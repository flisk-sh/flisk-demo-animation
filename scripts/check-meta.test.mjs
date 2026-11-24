import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('rejects share-card tags that do not point to the bundled PNG', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'flisk-share-card-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scripts = join(root, 'scripts');
  mkdirSync(scripts);
  const checker = join(scripts, 'check-meta.mjs');
  copyFileSync(new URL('./check-meta.mjs', import.meta.url), checker);
  copyFileSync(new URL('../og.png', import.meta.url), join(root, 'og.png'));

  for (const tag of ['og:image', 'twitter:image']) {
    const bad = html.replace(new RegExp(`(${tag}" content="[^"]*/)og\\.png`), '$1missing.png');
    assert.notEqual(bad, html, `fixture must change ${tag}`);
    writeFileSync(join(root, 'index.html'), bad);
    const result = spawnSync(process.execPath, [checker], { encoding: 'utf8' });
    assert.ifError(result.error);
    assert.equal(result.status, 1, `${tag} accepted a missing image`);
    assert.ok(result.stderr.includes(`${tag} must point to the bundled og.png`), result.stderr);
  }
});
