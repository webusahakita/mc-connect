const fs = require('fs');
let js = fs.readFileSync('public/js/sync-engine.js', 'utf8');

js = js.replace(/case 'mc_packages_config':/, "case 'mc_biodata_config':\\n                    SyncEngine.push('/api/cms/biodata', parsed);\\n                    break;\\n                case 'mc_packages_config':");

fs.writeFileSync('public/js/sync-engine.js', js, 'utf8');
console.log('Added mc_biodata_config to AdminDB.setItem');
