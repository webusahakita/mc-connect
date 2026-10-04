const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Remove the button
html = html.replace('<button class="btn music-subtab-btn" style="margin-left:auto; border:1px solid rgba(212,175,55,0.4) !important; color:var(--adm-gold) !important; background:rgba(212,175,55,0.1) !important;" onclick="window.openManageMusicBank()"><span>&#128194; Kelola Bank Musik Master</span></button>', '');

// Insert it into the sidebar before </ul></div><div class="sidebar-footer">
const newMenu = `
                    <!-- MENU 7: MUSIC BANK -->
                    <li>
                        <button class="sidebar-item-btn" id="menu-musicbank"
                            onclick="window.openManageMusicBank()">
                            <div class="sidebar-item-left">
                                <div class="sidebar-icon-sq">&#128194;</div>
                                <span>Master Bank Musik</span>
                            </div>
                        </button>
                    </li>
`;

html = html.replace(/(<\/ul>\s*<\/div>\s*<div class="sidebar-footer">)/, newMenu + '$1');

fs.writeFileSync('public/admin.html', html);
console.log('Button moved to sidebar');
