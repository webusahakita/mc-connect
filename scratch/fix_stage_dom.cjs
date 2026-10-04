const fs = require('fs');
let code = fs.readFileSync('public/stage.html', 'utf8');

const regex = /<!-- Sidebar anticipation fully removed -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<script src="js\/audio-storage\.js"><\/script>/;
if (regex.test(code)) {
    code = code.replace(regex, `<!-- Sidebar anticipation fully removed -->\n            </div>\n        </div>\n        <div id="giantNavRight" class="giant-nav-zone"></div>\n    </div>\n\n    <script src="js/audio-storage.js"></script>`);
    fs.writeFileSync('public/stage.html', code);
    console.log("Fixed DOM!");
} else {
    console.log("Regex didn't match. Looking for alternative.");
    const altRegex = /<!-- Sidebar anticipation fully removed -->[\s\S]*?<script src="js\/audio-storage\.js"><\/script>/;
    code = code.replace(altRegex, `<!-- Sidebar anticipation fully removed -->\n            </div>\n        </div>\n        <div id="giantNavRight" class="giant-nav-zone"></div>\n    </div>\n\n    <script src="js/audio-storage.js"></script>`);
    fs.writeFileSync('public/stage.html', code);
    console.log("Used alternative regex.");
}
