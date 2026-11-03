import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncSaasVersion } from '../../scripts/sync-saas-version.mjs';

test('SaaS Update Notifier 1: Version file and sync script work correctly', () => {
    // 1. Run sync
    const synced = syncSaasVersion();
    assert.ok(synced, 'syncSaasVersion must return payload');
    assert.ok(synced.commit_short, 'Commit short hash must exist');
    assert.ok(synced.commit_message, 'Commit message must exist');

    // 2. Read public/version.json
    const rawVersion = fs.readFileSync('public/version.json', 'utf8');
    const versionData = JSON.parse(rawVersion);
    assert.equal(versionData.commit_short, synced.commit_short, 'version.json short hash must match synced hash');
    assert.ok(Array.isArray(versionData.recent_commits), 'recent_commits must be an array');
});

test('SaaS Update Notifier 2: Script and hook configurations exist', () => {
    // 1. Script file exists
    assert.ok(fs.existsSync('public/js/saas-update-notifier.js'), 'saas-update-notifier.js must exist');
    const scriptContent = fs.readFileSync('public/js/saas-update-notifier.js', 'utf8');
    assert.ok(scriptContent.includes('window.saasNotifier'), 'window.saasNotifier API must exist');
    assert.ok(scriptContent.includes('saasUpdateBanner'), 'Update banner DOM element must be defined');
    assert.ok(scriptContent.includes('saasChangelogModal'), 'Changelog modal DOM element must be defined');

    // 2. Git hook exists
    assert.ok(fs.existsSync('.git/hooks/pre-commit') || fs.existsSync('.git/hooks/post-commit'), 'Git hook must exist');
    const hookContent = fs.readFileSync('.git/hooks/pre-commit', 'utf8');
    assert.ok(hookContent.includes('sync-saas-version.mjs'), 'Hook must trigger sync-saas-version.mjs');

    // 3. Script tags: ONLY on Admin Workspace, NOT on public landing pages
    const adminHtml = fs.readFileSync('resources/views/workspace/admin.html', 'utf8');
    assert.ok(adminHtml.includes('saas-update-notifier.js'), 'admin.html must load saas-update-notifier.js');

    const indexHtml = fs.readFileSync('public/index.html', 'utf8');
    assert.ok(!indexHtml.includes('saas-update-notifier.js'), 'index.html (landing page) must NOT load saas-update-notifier.js');

    const keunggulanHtml = fs.readFileSync('public/keunggulan.html', 'utf8');
    assert.ok(!keunggulanHtml.includes('saas-update-notifier.js'), 'keunggulan.html (sales page) must NOT load saas-update-notifier.js');

    const publicBlade = fs.readFileSync('resources/views/layouts/public.blade.php', 'utf8');
    assert.ok(!publicBlade.includes('saas-update-notifier.js'), 'public.blade.php layout must NOT load saas-update-notifier.js');

    const stageHtml = fs.readFileSync('resources/views/workspace/stage.html', 'utf8');
    assert.ok(!stageHtml.includes('saas-update-notifier.js'), 'stage.html must NOT load saas-update-notifier.js');

    const vendorHtml = fs.readFileSync('resources/views/workspace/vendor.html', 'utf8');
    assert.ok(!vendorHtml.includes('saas-update-notifier.js'), 'vendor.html must NOT load saas-update-notifier.js');

    // 4. Guard logic exists in script
    assert.ok(scriptContent.includes('isAdminContext'), 'saas-update-notifier.js must contain isAdminContext guard');
    assert.ok(scriptContent.includes('/index.html'), 'isAdminContext must reject index.html');
    assert.ok(scriptContent.includes('/keunggulan.html'), 'isAdminContext must reject keunggulan.html');
});
