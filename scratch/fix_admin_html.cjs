const fs = require('fs');

let html = fs.readFileSync('public/admin.html', 'utf8');

// 1. Fix Tab Buttons Emojis and Typo
html = html.replace(/<button class="cms-tab-btn active" onclick="switchCmsSubTab\('web-payment', this\)">.*?<\/button>/s, '<button class="cms-tab-btn active" onclick="switchCmsSubTab(\'web-payment\', this)">💳 Pembayaran & QRIS</button>');
html = html.replace(/<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-categories', this\)">.*?<\/button>/s, '<button class="cms-tab-btn" onclick="switchCmsSubTab(\'cms-categories\', this)">📅 Kategori Acara</button>');
html = html.replace(/<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-client-categories', this\)">.*?<\/button>/s, '<button class="cms-tab-btn" onclick="switchCmsSubTab(\'cms-client-categories\', this)">👥 Kategori Klien</button>');
html = html.replace(/<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-wa-templates', this\)">.*?<\/button>/s, '<button class="cms-tab-btn" onclick="switchCmsSubTab(\'cms-wa-templates\', this)">💬 Template WAA</button>');
html = html.replace(/<button class="cms-tab-btn" onclick="switchCmsSubTab\('cms-cashflow-categories', this\)">.*?<\/button>/s, '<button class="cms-tab-btn" onclick="switchCmsSubTab(\'cms-cashflow-categories\', this)">💰 Kategori Arus Kas</button>');
html = html.replace(/<button class="cms-tab-btn" onclick="switchCmsSubTab\('web-logo', this\)">.*?<\/button>/s, '<button class="cms-tab-btn" onclick="switchCmsSubTab(\'web-logo\', this)">🌐 Logo Web & Invoice</button>');

// 2. Fix Description Typos
html = html.replace('penerimpembayaran', 'penerima pembayaran');
html = html.replace('Jikdibiarkan', 'Jika dibiarkan');
html = html.replace('Andtentukan', 'Anda tentukan');
html = html.replace('Andtentukan', 'Anda tentukan'); // two occurrences
html = html.replace('padform', 'pada form');
html = html.replace('padform', 'pada form');
html = html.replace('Andmengklasifikasikan', 'Anda mengklasifikasikan');
html = html.replace('data  (', 'data (');
html = html.replace('KelolTemplate WAA', 'Kelola Template WAA');
html = html.replace('bisdigunakan', 'bisa digunakan');
html = html.replace('nampelanggan', 'nama pelanggan');
html = html.replace('namacara', 'nama acara');
html = html.replace('xx Kategori Pemasukan', 'Kategori Pemasukan');

// 3. Fix Logo Web Position & Display Bug
// Find where it currently is:
// It's after `</div></div></div>` at the end of WA templates, closing `sec-web-settings`.
// Then we have `<div class="cms-subpanel" id="web-logo" style="display:none;">`
const logoSnippetOriginal = `                <!-- Logo Web Settings -->
                <div class="cms-subpanel" id="web-logo" style="display:none;">`;

const logoSnippetNew = `                <!-- Logo Web Settings -->
                <div class="cms-subpanel" id="web-logo">`;

html = html.replace(logoSnippetOriginal, logoSnippetNew);

// Move the closing div of sec-web-settings
const closingTagsBeforeLogo = `                        </div>
                    </div>
                </div>
            </div>

            
                <!-- Logo Web Settings -->`;

const closingTagsNew = `                        </div>
                    </div>
                </div>

                <!-- Logo Web Settings -->`;

html = html.replace(closingTagsBeforeLogo, closingTagsNew);

// Add the closing div AFTER web-logo
const formCloseAndDivs = `                            </div>
                        </form>
                    </div>
                </div>

            <!-- ================= MENU 5: EVENT COMMAND CENTER ================= -->`;

const newFormCloseAndDivs = `                            </div>
                        </form>
                    </div>
                </div>
            </div> <!-- Close sec-web-settings -->

            <!-- ================= MENU 5: EVENT COMMAND CENTER ================= -->`;

html = html.replace(formCloseAndDivs, newFormCloseAndDivs);

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed typos, emojis, and web-logo bug in admin.html');
