import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { buildRelease } from '../../deployment/hostinger/build-release.mjs';

test('release contains only deployable sources, refreshes assets and detects tampering', () => {
    const revision = 'a'.repeat(40);
    const release = buildRelease({ revision });
    assert.ok(fs.statSync(release.archive).size > 0);
    const files = Object.keys(release.files);
    assert.ok(files.length > 100);
    assert.ok(!files.some(file => /^mc-connect\/(?:\.env$|vendor\/|node_modules\/|chrome_snap_profile\/)/.test(file)));
    assert.deepEqual(files.filter(file => file.startsWith('public_html/uploads/')), ['public_html/uploads/.htaccess']);
    assert.ok(!files.some(file => file.startsWith('mc-connect/storage/') || file.startsWith('mc-connect/bootstrap/cache/')));
    assert.ok(!files.includes('public_html/admin.html'));
    assert.ok(files.includes('mc-connect/resources/views/workspace/admin.html'));
    const admin = fs.readFileSync(path.join(release.root, 'mc-connect/resources/views/workspace/admin.html'), 'utf8');
    assert.match(admin, /session-client\.js\?v=aaaaaaaaaaaa/);
    const sw = fs.readFileSync(path.join(release.root, 'public_html/sw.js'), 'utf8');
    assert.match(sw, /const CACHE_NAME = 'mc-connect-aaaaaaaaaaaa'/);

    const verify = () => spawnSync('php', ['deployment/hostinger/verify-release.php', release.root, revision], { encoding: 'utf8' });
    const valid = verify();
    assert.equal(valid.status, 0, valid.stderr);
    fs.appendFileSync(path.join(release.root, 'public_html/index.html'), 'tampered');
    assert.notEqual(verify().status, 0, 'A changed file must fail integrity verification');
});

test('release builder rejects branch names and abbreviated revisions', () => {
    assert.throws(() => buildRelease({ revision: 'main' }), /full Git commit SHA/);
    assert.throws(() => buildRelease({ revision: 'abc1234' }), /full Git commit SHA/);
});
