<?php
$content = file_get_contents('public/js/admin-core.js');

function replaceFunctionBody($content, $funcName, $newBody) {
    $startPos = strpos($content, "async function $funcName");
    if ($startPos === false) return $content;
    
    $endString = "window.$funcName = $funcName;";
    $endPos = strpos($content, $endString, $startPos);
    if ($endPos === false) return $content;
    
    $before = substr($content, 0, $startPos);
    $after = substr($content, $endPos);
    
    return $before . $newBody . "\n" . $after;
}

// 1. promptAddFaq
$newContent = replaceFunctionBody($content, 'promptAddFaq', <<<EOT
async function promptAddFaq() {
    const res = await uiCustomForm([
        { id: 'q', label: 'Pertanyaan FAQ', type: 'text' },
        { id: 'a', label: 'Jawaban FAQ', type: 'textarea' }
    ], 'Tambah FAQ Baru');
    if (!res || !res.q || !res.a) return;
    
    const faqs = getCmsFaqs();
    faqs.push({ q: res.q, a: res.a });
    
    const savedPol = localStorage.getItem('mc_policies_config') ? JSON.parse(localStorage.getItem('mc_policies_config')) : {};
    savedPol.faqs = faqs;
    
    window._isSyncing = true;
    localStorage.setItem('mc_policies_config', JSON.stringify(savedPol));
    window._isSyncing = false;
    
    renderAdminCmsFaqs();
    
    try {
        await apiPost('/cms/policies', savedPol);
        if(typeof showToast === 'function') showToast('FAQ baru berhasil disimpan dan terintegrasi!', 'green');
    } catch(e) {
        console.error(e);
        if(typeof showToast === 'function') showToast('Gagal menyimpan ke server!', 'red');
    }
}
EOT
);

// 2. promptEditFaq
$newContent = replaceFunctionBody($newContent, 'promptEditFaq', <<<EOT
async function promptEditFaq(idx) {
    let faqs = getCmsFaqs();
    if (!faqs[idx]) return;
    
    const res = await uiCustomForm([
        { id: 'q', label: 'Ubah Pertanyaan FAQ', type: 'text', value: faqs[idx].q },
        { id: 'a', label: 'Ubah Jawaban FAQ', type: 'textarea', value: faqs[idx].a }
    ], 'Edit FAQ');
    if (!res || !res.q || !res.a) return;
    
    faqs[idx] = { q: res.q, a: res.a };
    const savedPol = localStorage.getItem('mc_policies_config') ? JSON.parse(localStorage.getItem('mc_policies_config')) : {};
    savedPol.faqs = faqs;
    
    window._isSyncing = true;
    localStorage.setItem('mc_policies_config', JSON.stringify(savedPol));
    window._isSyncing = false;
    
    renderAdminCmsFaqs();
    
    try {
        await apiPost('/cms/policies', savedPol);
        if(typeof showToast === 'function') showToast('Perubahan FAQ berhasil disimpan dan terintegrasi!', 'green');
    } catch(e) {
        console.error(e);
        if(typeof showToast === 'function') showToast('Gagal menyimpan ke server!', 'red');
    }
}
EOT
);

// 3. promptAddTestimonial
$newContent = replaceFunctionBody($newContent, 'promptAddTestimonial', <<<EOT
async function promptAddTestimonial() {
    const res = await uiCustomForm([
        { id: 'author', label: 'Nama Klien', type: 'text' },
        { id: 'role', label: 'Peran / Jabatan (contoh: Mempelai Wanita)', type: 'text', value: 'Klien' },
        { id: 'text', label: 'Isi Testimoni', type: 'textarea' }
    ], 'Tambah Testimoni Baru');
    if (!res || !res.author || !res.text) return;
    
    let items = getCmsTestimonials();
    items.push({ rating: 5, text: res.text, author: res.author, role: res.role });
    
    window._isSyncing = true;
    localStorage.setItem('mc_testimonials_config', JSON.stringify(items));
    window._isSyncing = false;
    
    renderAdminCmsTestimonials();
    
    try {
        await apiPost('/cms/testimonials', { testimonials: items });
        if(typeof showToast === 'function') showToast('Testimoni baru berhasil disimpan dan terintegrasi!', 'green');
    } catch(e) {
        console.error(e);
        if(typeof showToast === 'function') showToast('Gagal menyimpan ke server!', 'red');
    }
}
EOT
);

// 4. promptEditTestimonial
$newContent = replaceFunctionBody($newContent, 'promptEditTestimonial', <<<EOT
async function promptEditTestimonial(idx) {
    let items = getCmsTestimonials();
    if (!items[idx]) return;
    
    const res = await uiCustomForm([
        { id: 'author', label: 'Ubah Nama Klien', type: 'text', value: items[idx].author },
        { id: 'role', label: 'Ubah Peran / Jabatan', type: 'text', value: items[idx].role || 'Klien' },
        { id: 'text', label: 'Ubah Isi Testimoni', type: 'textarea', value: items[idx].text }
    ], 'Edit Testimoni');
    if (!res || !res.author || !res.text) return;
    
    items[idx] = { rating: items[idx].rating || 5, text: res.text, author: res.author, role: res.role };
    
    window._isSyncing = true;
    localStorage.setItem('mc_testimonials_config', JSON.stringify(items));
    window._isSyncing = false;
    
    renderAdminCmsTestimonials();
    
    try {
        await apiPost('/cms/testimonials', { testimonials: items });
        if(typeof showToast === 'function') showToast('Perubahan testimoni berhasil disimpan dan terintegrasi!', 'green');
    } catch(e) {
        console.error(e);
        if(typeof showToast === 'function') showToast('Gagal menyimpan ke server!', 'red');
    }
}
EOT
);

file_put_contents('public/js/admin-core.js', $newContent);
echo "admin-core.js notifications and api fixes applied successfully\n";
