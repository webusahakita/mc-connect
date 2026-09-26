const fs = require('fs');

// Update backend controller to handle 'id' for updates
const controllerFile = 'app/Http/Controllers/CmsApiController.php';
let ctrl = fs.readFileSync(controllerFile, 'utf8');
const ctrlTarget = `        $validated = $request->validate([
            'type' => 'required|in:in,out',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'required|date',
            'desc' => 'required|string',
            'eventId' => 'nullable|integer'
        ]);

        $transaction = \\App\\Models\\CmsCashflowTransaction::create([
            'mc_id' => $mc->id,
            'tipe' => $validated['type'],
            'kategori' => $validated['category'],
            'nominal' => $validated['amount'],
            'tanggal' => $validated['date'],
            'deskripsi' => $validated['desc'],
            'event_id' => $validated['eventId'] ?? null
        ]);`;

const ctrlReplacement = `        $validated = $request->validate([
            'id' => 'nullable|integer',
            'type' => 'required|in:in,out',
            'category' => 'required|string',
            'amount' => 'required|numeric',
            'date' => 'required|date',
            'desc' => 'required|string',
            'eventId' => 'nullable|integer'
        ]);

        if (!empty($validated['id'])) {
            $transaction = \\App\\Models\\CmsCashflowTransaction::where('mc_id', $mc->id)->findOrFail($validated['id']);
            $transaction->update([
                'tipe' => $validated['type'],
                'kategori' => $validated['category'],
                'nominal' => $validated['amount'],
                'tanggal' => $validated['date'],
                'deskripsi' => $validated['desc'],
                'event_id' => $validated['eventId'] ?? null
            ]);
        } else {
            $transaction = \\App\\Models\\CmsCashflowTransaction::create([
                'mc_id' => $mc->id,
                'tipe' => $validated['type'],
                'kategori' => $validated['category'],
                'nominal' => $validated['amount'],
                'tanggal' => $validated['date'],
                'deskripsi' => $validated['desc'],
                'event_id' => $validated['eventId'] ?? null
            ]);
        }`;
if (ctrl.includes(ctrlTarget.replace(/\r\n/g, '\n'))) {
    ctrl = ctrl.replace(ctrlTarget.replace(/\r\n/g, '\n'), ctrlReplacement);
} else {
    // try exact string replace with regex spaces
    ctrl = ctrl.replace(/type' => 'required\|in:in,out',[\s\S]*?\]\);/m, ctrlReplacement);
}
fs.writeFileSync(controllerFile, ctrl, 'utf8');

// Update frontend js
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');
const jsTarget = `    try {
        const res = await fetch('/api/cms/cashflow-transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify({ type, category: cat, amount, date, desc })
        });`;

const jsReplacement = `    const editId = document.getElementById('editCfId') ? document.getElementById('editCfId').value : '';
    try {
        const payload = { type, category: cat, amount, date, desc };
        if (editId) payload.id = editId;

        const res = await fetch('/api/cms/cashflow-transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            body: JSON.stringify(payload)
        });`;

js = js.replace(jsTarget, jsReplacement);

// Fix edit function to use window.cashflowDb if needed. Wait, cashflow is from API. 
// In admin-core.js, loadCashflowTransactions saves to window.cashflowDb = json.data;
const editFunction = `
window.editCashflowTransaction = function(id) {
    if (!window.cashflowDb) return;
    const txn = window.cashflowDb.find(t => String(t.id) === String(id));
    if (!txn) return;
    
    // Set fields
    let editIdField = document.getElementById('editCfId');
    if (!editIdField) {
        editIdField = document.createElement('input');
        editIdField.type = 'hidden';
        editIdField.id = 'editCfId';
        const form = document.querySelector('#addCashModal form');
        if(form) form.appendChild(editIdField);
    }
    editIdField.value = txn.id;
    
    const typeVal = txn.tipe === 'in' || txn.tipe === 'masuk' ? 'in' : 'out';
    document.getElementById('newCfType').value = typeVal;
    
    if (typeof renderCashflowCategories === 'function') {
        renderCashflowCategories();
    }
    
    document.getElementById('newCfCategory').value = txn.kategori;
    document.getElementById('newCfAmount').value = txn.nominal;
    document.getElementById('newCfDesc').value = txn.deskripsi;
    
    document.getElementById('addCashModal').classList.add('active');
};
`;

if (!js.includes('window.editCashflowTransaction =')) {
    js += editFunction;
}

const openTarget = `function openAddCashModal() {
    document.getElementById('addCashModal').classList.add('active');
}`;
const openReplace = `function openAddCashModal() {
    if(document.getElementById('editCfId')) document.getElementById('editCfId').value = '';
    const form = document.querySelector('#addCashModal form');
    if(form) form.reset();
    document.getElementById('addCashModal').classList.add('active');
}`;
js = js.replace(openTarget, openReplace);

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');

console.log('Backend and frontend updated for Cashflow Edit feature.');
