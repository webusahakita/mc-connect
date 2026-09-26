const fs = require('fs');
let code = fs.readFileSync('app/Http/Controllers/CmsApiController.php', 'utf8');

// safely decode a field
function safeDecode(field) {
    return `(is_string(${field}) ? json_decode(${field}, true) : ${field})`;
}

// Fix calendarConfig line 56
code = code.replace(/'calendarConfig'\s*=>\s*\$mc->calendar_config,/, `'calendarConfig' => is_string($mc->calendar_config) ? json_decode($mc->calendar_config, true) : $mc->calendar_config,`);

// Fix payment_config line 334
code = code.replace(/\$config\s*=\s*\$mc->payment_config;/, `$config = is_string($mc->payment_config) ? json_decode($mc->payment_config, true) : $mc->payment_config;`);

// Fix event_categories line 599
code = code.replace(/json_decode\(\$mc->event_categories,\s*true\)/g, `(is_string($mc->event_categories) ? json_decode($mc->event_categories, true) : $mc->event_categories)`);

// Fix client_categories line 1104
code = code.replace(/json_decode\(\$mc->client_categories,\s*true\)/g, `(is_string($mc->client_categories) ? json_decode($mc->client_categories, true) : $mc->client_categories)`);

// Fix wa_templates
code = code.replace(/json_decode\(\$mc->wa_templates,\s*true\)/g, `(is_string($mc->wa_templates) ? json_decode($mc->wa_templates, true) : $mc->wa_templates)`);

fs.writeFileSync('app/Http/Controllers/CmsApiController.php', code);
console.log("Fixed CmsApiController JSON decodes");
