const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

// The issue is an extra </div> followed by a duplicate <script> block and another </div>
// Specifically, lines 1497-1525.
// We can use regex to match the duplicate <script> and the extra </div>

const regex = /<\/script>\s*<\/div>\s*<script>\s*function autoFillDummyRiders\(\) {[\s\S]*?<\/script>\s*<\/div>/;

if (regex.test(content)) {
    content = content.replace(regex, '</script>\n                            </div>');
    fs.writeFileSync('public/admin.html', content, 'utf8');
    console.log('Fixed DOM structure in admin.html using regex');
} else {
    console.log('Regex did not match');
}
