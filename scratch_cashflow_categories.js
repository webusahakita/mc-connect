
window.renderCashflowCategories = function() {
    const type = document.getElementById('newCfType').value;
    const cat = document.getElementById('newCfCategory');
    if (!cat) return;
    let opts = '<option value="" disabled selected>-- Pilih Kategori --</option>';
    if (type === 'in' || type === 'inflow') {
        opts += '<option value="Sponsorship">Sponsorship / Endorsement</option><option value="Lainnya">Pendapatan Lainnya</option>';
    } else {
        opts += '<option value="Transportasi">Biaya Transportasi</option><option value="Konsumsi">Biaya Konsumsi / Meals</option><option value="Wardrobe">Biaya Wardrobe / Makeup</option><option value="Lainnya">Pengeluaran Lainnya</option>';
    }
    cat.innerHTML = opts;
};
