const fs = require('fs');
const htmlFile = 'public/admin.html';
let htmlCode = fs.readFileSync(htmlFile, 'utf8');

const targetStr = `                                <button class="btn music-subtab-btn" id="btnSubtabLanding"
                                    onclick="switchMusicSubtab('landing')">
                                    <span>&#127760; Musik Landing Page</span>
                                </button>
                            </div>`;
const newHtml = `                                <button class="btn music-subtab-btn" id="btnSubtabLanding"
                                    onclick="switchMusicSubtab('landing')">
                                    <span>&#127760; Musik Landing Page</span>
                                </button>
                                <button class="btn music-subtab-btn" style="margin-left:auto; border:1px solid rgba(212,175,55,0.4) !important; color:var(--adm-gold) !important; background:rgba(212,175,55,0.1) !important;" onclick="window.openManageMusicBank()">
                                    <span>&#128194; Kelola Bank Musik Master</span>
                                </button>
                            </div>`;

htmlCode = htmlCode.replace(/(onclick="switchMusicSubtab\('landing'\)">\s*<span>.*?Musik Landing Page<\/span>\s*<\/button>\s*)<\/div>/, '$1<button class="btn music-subtab-btn" style="margin-left:auto; border:1px solid rgba(212,175,55,0.4) !important; color:var(--adm-gold) !important; background:rgba(212,175,55,0.1) !important;" onclick="window.openManageMusicBank()"><span>&#128194; Kelola Bank Musik Master</span></button></div>');
htmlCode = htmlCode.replace(/&#127760;/g, '&#127760;').replace(/ðŸŒ /g, '&#127760;'); 
fs.writeFileSync(htmlFile, htmlCode);
console.log('Modified admin.html to add Kelola Bank button');
