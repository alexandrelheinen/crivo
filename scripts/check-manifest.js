'use strict';

// Checks manifest.json against the acceptance criteria that are claims
// about the manifest rather than about a page: AC-EXT-01 and AC-EXT-02.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

const checks = [
  [
    'manifest_version is 3',
    () => assert.equal(manifest.manifest_version, 3),
  ],
  [
    'name and version are present',
    () => {
      assert.ok(manifest.name);
      assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
    },
  ],
  [
    'no permission is requested [AC-EXT-01]',
    () => {
      assert.equal('permissions' in manifest, false);
      assert.equal('host_permissions' in manifest, false);
      assert.equal('optional_permissions' in manifest, false);
    },
  ],
  [
    'the content script matches LinkedIn jobs only [AC-EXT-02]',
    () => {
      assert.equal(manifest.content_scripts.length, 1);
      assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.linkedin.com/jobs/*']);
      assert.equal(manifest.content_scripts[0].run_at, 'document_end');
    },
  ],
  [
    'the matcher loads before the reader',
    () => {
      assert.deepEqual(manifest.content_scripts[0].js, ['matcher.js', 'content.js']);
    },
  ],
  [
    'every declared file exists',
    () => {
      for (const file of manifest.content_scripts[0].js) {
        assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
      }
    },
  ],
];

let failed = 0;
for (const [name, check] of checks) {
  try {
    check();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL ${name}: ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} manifest check(s) failed.`);
  process.exit(1);
}
