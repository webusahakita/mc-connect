const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const target = `                        <div style="text-align:right;">
                            <button type="button" class="btn btn-primary" onclick="handleSaveWaTemplates()">Simpan Template WAA</button>
                        </div>
                    </div>
                </div>
            </div>

            
                <!-- Logo Web Settings -->`;

const replacement = `                        <div style="text-align:right;">
                            <button type="button" class="btn btn-primary" onclick="handleSaveWaTemplates()">Simpan Template WAA</button>
                        </div>
                    </div>
                </div>

                <!-- Logo Web Settings -->`;

html = html.replace(target, replacement);
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed extra div in admin.html');
