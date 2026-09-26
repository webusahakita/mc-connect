const fs = require('fs');
fs.appendFileSync('public/js/cms-overrides.js', '\n\n// Trigger initial load\ndocument.addEventListener("DOMContentLoaded", window.initAdminCms);\n');
