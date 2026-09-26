const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

const oldTableStr = `<div class="table-responsive" style="border:1px solid var(--adm-border); border-radius:var(--adm-radius-md); overflow:hidden; margin-bottom:1.5rem;">
                                <table class="adm-table">
                                <thead>
                                    <tr>
                                        <th style="width:25%;">Judul Rider</th>
                                        <th style="width:60%;">Catatan Khusus</th>
                                        <th style="width:15%; text-align:right;">Aksi</th>
                                    </tr>
                                </thead>
                                    <tbody id="ridersTableBody">
                                        <!-- Rendered by JS -->
                                    </tbody>
                                </table>
                            </div>`;
                            
const newDivStr = `<div id="ridersListContainer" style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
                                <!-- Rendered by JS -->
                            </div>`;

html = html.replace(oldTableStr, newDivStr);
// If it fails because of \r\n, let's use regex
html = html.replace(/<div class="table-responsive"[\s\S]*?<\/table>[\s\S]*?<\/div>/, newDivStr);

fs.writeFileSync('public/admin.html', html);
console.log('Fixed admin.html Riders list container');
