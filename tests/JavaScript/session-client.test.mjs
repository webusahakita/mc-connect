import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../public/js/session-client.js', import.meta.url), 'utf8');
const syncSource = readFileSync(new URL('../../public/js/sync-engine.js', import.meta.url), 'utf8');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

function browser(path, handler) {
    const location = new URL(path, 'https://mc.test');
    const redirects = [];
    location.replace = url => redirects.push(url);
    const storage = new Map();
    let meta;
    const context = vm.createContext({
        URL, Request, Headers, Response, FormData, console,
        document: {
            querySelector: () => meta,
            createElement: () => ({}),
            head: { appendChild(element) { meta = element; } },
        },
        sessionStorage: { setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    });
    context.window = {
        location,
        fetch: async (input, options) => handler(input instanceof Request ? input : new Request(new URL(input, location), options)),
    };
    vm.runInContext(source, context);
    return { window: context.window, redirects, context };
}

test('public booking sends a session CSRF token without requiring login', async () => {
    const calls = [];
    const { window, redirects } = browser('/', async request => {
        calls.push(request);
        return request.url.endsWith('/csrf-token') ? json({ token: 'public-csrf' }) : json({ success: true });
    });
    await window.fetch('/api/book/request', { method: 'POST', body: JSON.stringify({ name: 'Guest' }) });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].headers.get('X-CSRF-TOKEN'), 'public-csrf');
    assert.equal(calls[1].credentials, 'same-origin');
    assert.deepEqual(redirects, []);
});

test('admin uploads retain the multipart body and use the server session', async () => {
    let upload;
    const { window } = browser('/admin.html', async request => {
        if (request.url.endsWith('/mc/session')) return json({ user: { id: 5, name: 'MC' } });
        if (request.url.endsWith('/csrf-token')) return json({ token: 'upload-csrf' });
        upload = request;
        return json({ success: true });
    });
    const form = new FormData();
    form.set('caption', 'Uploaded photograph');
    await window.fetch('/api/cms/gallery/upload', { method: 'POST', body: form });
    assert.equal(window.MCSession.user.id, 5);
    assert.equal(upload.headers.get('X-CSRF-TOKEN'), 'upload-csrf');
    assert.equal((await upload.formData()).get('caption'), 'Uploaded photograph');
});

test('an expired token is refreshed once and the rejected request body is retained', async () => {
    let tokens = 0;
    const writes = [];
    const { window } = browser('/', async request => {
        if (request.url.endsWith('/csrf-token')) return json({ token: 'csrf-' + ++tokens });
        writes.push({ token: request.headers.get('X-CSRF-TOKEN'), body: await request.text() });
        return writes.length === 1 ? json({}, 419) : json({ success: true });
    });
    const response = await window.fetch('/api/book/request', { method: 'POST', body: 'same body' });
    assert.equal(response.status, 200);
    assert.deepEqual(writes, [{ token: 'csrf-1', body: 'same body' }, { token: 'csrf-2', body: 'same body' }]);
    assert.equal(tokens, 2);
});

test('expired workspace sessions return to login with the selected event', async () => {
    const { window, redirects } = browser('/stage.html?event=12', async () => json({}, 401));
    await window.MCSession.ready;
    assert.deepEqual(redirects, ['/login?redirect=%2Fstage.html%3Fevent%3D12']);
});

test('login errors stay on the login form and external requests get no CSRF header', async () => {
    const calls = [];
    const { window, redirects } = browser('/login', async request => {
        calls.push(request);
        return request.url.endsWith('/csrf-token') ? json({ token: 'csrf' }) : json({}, 401);
    });
    await window.fetch('/api/mc/login', { method: 'POST' });
    await window.fetch('https://external.test/api/upload', { method: 'POST' });
    assert.deepEqual(redirects, []);
    assert.equal(calls.at(-1).headers.get('X-CSRF-TOKEN'), null);
    assert.equal(calls.length, 3);
});

test('Request objects retain their JSON body and explicit options', async () => {
    let sent;
    const { window } = browser('/', async request => {
        if (request.url.endsWith('/csrf-token')) return json({ token: 'csrf' });
        sent = request;
        return json({ success: true });
    });
    const request = new Request('https://mc.test/api/book/request', {
        method: 'POST', body: JSON.stringify({ name: 'Guest' }),
        headers: { 'Content-Type': 'application/json' },
    });
    await window.fetch(request, { headers: { 'Content-Type': 'application/json', 'X-Custom': 'kept' } });
    assert.deepEqual(await sent.json(), { name: 'Guest' });
    assert.equal(sent.headers.get('X-Custom'), 'kept');
});

function syncEngine() {
    const storage = new Map();
    const calls = [];
    const context = vm.createContext({
        console, JSON, Date,
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        fetch: async endpoint => { calls.push(endpoint); return json({ success: true }); },
        window: { MCSession: { user: { id: 5 }, ready: Promise.resolve() }, addEventListener() {} },
    });
    vm.runInContext(syncSource, context);
    return { context, storage, calls, engine: context.window.SyncEngine };
}

test('offline replay only sends changes owned by the current session', async () => {
    const { storage, calls, engine } = syncEngine();
    storage.set('mc_offline_queue', JSON.stringify([
        { endpoint: '/legacy', data: {} },
        { endpoint: '/other-owner', data: {}, ownerId: 9 },
        { endpoint: '/current-owner', data: {}, ownerId: 5 },
    ]));
    await engine.flushOfflineQueue();
    assert.deepEqual(calls, ['/current-owner']);
    assert.equal(JSON.parse(storage.get('mc_offline_queue')).length, 2);
});

test('authorization failures are not added to the offline write queue', async () => {
    const { context, storage, engine } = syncEngine();
    context.fetch = async () => json({}, 401);
    const result = await engine.push('/api/cms/biodata', { name: 'Changed' });
    assert.equal(result.offline, false);
    assert.equal(result.status, 401);
    assert.equal(storage.has('mc_offline_queue'), false);
});
