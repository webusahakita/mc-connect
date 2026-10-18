import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export function buildRelease({ projectRoot = path.resolve(here, '../..'), outputRoot, revision }) {
    if (!/^[a-f0-9]{40}$/.test(revision || '')) throw new Error('A full Git commit SHA is required.');
    outputRoot ||= path.join(projectRoot, 'scratch/releases');
    fs.mkdirSync(outputRoot, { recursive: true });
    const work = fs.mkdtempSync(path.join(outputRoot, `mc-connect-${revision.slice(0, 12)}-`));
    const root = path.join(work, 'package');
    const app = path.join(root, 'mc-connect');
    const web = path.join(root, 'public_html');
    fs.mkdirSync(app, { recursive: true });
    fs.mkdirSync(web, { recursive: true });

    function copy(from, to) {
        const stat = fs.lstatSync(from);
        if (stat.isSymbolicLink()) throw new Error(`Symlinks are not allowed in release sources: ${from}`);
        if (stat.isDirectory()) {
            fs.mkdirSync(to, { recursive: true, mode: 0o755 });
            for (const child of fs.readdirSync(from)) copy(path.join(from, child), path.join(to, child));
        } else if (stat.isFile()) {
            fs.copyFileSync(from, to);
            fs.chmodSync(to, 0o644);
        } else {
            throw new Error(`Unsupported release source: ${from}`);
        }
    }

    for (const directory of ['app', 'config', 'resources', 'routes', 'deployment']) {
        copy(path.join(projectRoot, directory), path.join(app, directory));
    }
    for (const name of ['artisan', 'composer.json', 'composer.lock', '.env.production.example']) {
        copy(path.join(projectRoot, name), path.join(app, name));
    }
    fs.mkdirSync(path.join(app, 'bootstrap/cache'), { recursive: true });
    for (const name of fs.readdirSync(path.join(projectRoot, 'bootstrap')).filter(name => name.endsWith('.php'))) {
        copy(path.join(projectRoot, 'bootstrap', name), path.join(app, 'bootstrap', name));
    }
    fs.mkdirSync(path.join(app, 'database'), { recursive: true });
    copy(path.join(projectRoot, 'database/migrations'), path.join(app, 'database/migrations'));
    for (const directory of ['css', 'js', 'build']) copy(path.join(projectRoot, 'public', directory), path.join(web, directory));
    for (const name of ['.htaccess', 'index.html', 'login.html', 'favicon.jpg', 'manifest.json', 'sw.js']) {
        copy(path.join(projectRoot, 'public', name), path.join(web, name));
    }
    copy(path.join(here, 'index.php'), path.join(web, 'index.php'));
    for (const directory of ['storage/app/public', 'storage/app/private', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/logs']) {
        fs.mkdirSync(path.join(app, directory), { recursive: true });
    }
    fs.mkdirSync(path.join(web, 'uploads'), { recursive: true });
    copy(path.join(projectRoot, 'public/uploads/.htaccess'), path.join(web, 'uploads/.htaccess'));

    // Every release gives first-party styles/scripts a fresh URL for existing visitors.
    for (const file of ['index.html', 'login.html'].map(name => path.join(web, name)).concat(
        ['admin', 'stage', 'vendor'].map(name => path.join(app, 'resources/views/workspace', `${name}.html`))
    )) {
        const html = fs.readFileSync(file, 'utf8').replace(
            /((?:src|href)=")(\/?(?:js|css)\/[^"?#]+)(?:\?[^"#]*)?"/g,
            `$1$2?v=${revision.slice(0, 12)}"`
        );
        fs.writeFileSync(file, html);
    }
    const sw = path.join(web, 'sw.js');
    fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'mc-connect-${revision.slice(0, 12)}';`));
    const template = path.join(app, '.env.production.example');
    fs.writeFileSync(template, fs.readFileSync(template, 'utf8').replace('APP_URL=https://example.com', 'APP_URL=https://mc.webusaha.com'));

    const files = {};
    function inventory(directory) {
        for (const name of fs.readdirSync(directory).sort()) {
            const full = path.join(directory, name);
            if (fs.statSync(full).isDirectory()) inventory(full);
            else files[path.relative(root, full).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
        }
    }
    inventory(root);
    fs.writeFileSync(path.join(root, 'release.json'), JSON.stringify({ revision, files }, null, 2));
    const archive = path.join(work, `mc-connect-${revision}.tar.gz`);
    const tar = spawnSync('tar', ['-czf', archive, '-C', root, 'mc-connect', 'public_html', 'release.json'], { encoding: 'utf8' });
    if (tar.status !== 0) throw new Error(tar.stderr || 'Unable to build release archive.');
    return { archive, root, revision, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
    const release = buildRelease({ revision: option('--revision'), outputRoot: option('--output') });
    process.stdout.write(release.archive + '\n');
}
