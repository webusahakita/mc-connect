import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function syncSaasVersion() {
    try {
        const rawLog = execFileSync('git', ['log', '-1', '--format=%H;;;%h;;;%s;;;%an;;;%cI'], {
            cwd: projectRoot,
            encoding: 'utf8'
        }).trim();
        const [fullHash, shortHash, subject, author, date] = rawLog.split(';;;');

        const rawRecent = execFileSync('git', ['log', '-5', '--format=%h;;;%s;;;%cI'], {
            cwd: projectRoot,
            encoding: 'utf8'
        }).trim();

        const recentCommits = rawRecent.split('\n').filter(Boolean).map(line => {
            const [h, s, d] = line.split(';;;');
            return { hash: h, message: s, date: d };
        });

        const versionPath = path.join(projectRoot, 'public/version.json');
        let existing = {};
        if (fs.existsSync(versionPath)) {
            try { existing = JSON.parse(fs.readFileSync(versionPath, 'utf8')); } catch(e) {}
        }

        const versionPayload = {
            version: existing.version || '2.5.0',
            commit_hash: fullHash || 'latest',
            commit_short: shortHash || 'latest',
            commit_message: subject || 'Pembaruan Fitur SaaS',
            commit_author: author || 'Developer',
            commit_date: date || new Date().toISOString(),
            recent_commits: recentCommits,
            updated_at: new Date().toISOString(),
            release_title: subject ? `Pembaruan: ${subject}` : 'SaaS Continuous Feature Release',
            notification_active: true
        };

        fs.writeFileSync(versionPath, JSON.stringify(versionPayload, null, 2));
        console.log(`✅ [SaaS Update Sync] Version updated: ${shortHash} - "${subject}"`);
        return versionPayload;
    } catch (err) {
        console.error('⚠️ [SaaS Update Sync Error]:', err.message);
        return null;
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    syncSaasVersion();
}
