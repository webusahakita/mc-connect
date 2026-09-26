const fs = require('fs');
let js = fs.readFileSync('public/js/sync-engine.js', 'utf8');

// The bad line contains literal '\n'
js = js.replace(/case 'mc_biodata_config':\\n\s+SyncEngine\.push\('\/api\/cms\/biodata', parsed\);\\n\s+break;\\n\s+case 'mc_packages_config':/, 
`case 'mc_biodata_config':
                    SyncEngine.push('/api/cms/biodata', parsed);
                    break;
                case 'mc_packages_config':`);

fs.writeFileSync('public/js/sync-engine.js', js, 'utf8');
console.log('Fixed sync-engine syntax error');
