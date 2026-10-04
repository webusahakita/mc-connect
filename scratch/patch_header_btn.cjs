const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\resources\\views\\admin\\command-center.blade.php';
let content = fs.readFileSync(path, 'utf8');

const regex = /<button class="btn btn-secondary btn-sm" onclick="document\.getElementById\('addRundownModal'\)\.classList\.add\('active'\)">[\s\S]*?\+ Tambah Segmen Baru[\s\S]*?<\/button>/g;

const replacement = `<button class="btn btn-secondary btn-sm" onclick="window.applyDefaultRundown()" title="Terapkan Susunan Acara Standar (Bawaan)" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3);">
                        📋 Gunakan Template Default
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('addRundownModal').classList.add('active')">
                        + Tambah Segmen Baru
                    </button>`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log("Injected Template Default button into the header of command-center.blade.php!");
