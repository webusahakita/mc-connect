<?php
$content = file_get_contents('public/js/admin-core.js');

// 1. promptAddFaq
$newContent = preg_replace_callback('/async function promptAddFaq\(\) \{.*?\n\}/s', function($matches) {
    return <<<EOT
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
    localStorage.setItem('mc_policies_config', JSON.stringify(savedPol));
    
    renderAdminCmsFaqs();
}
EOT;
}, $content);

// 2. promptEditFaq
$newContent = preg_replace_callback('/async function promptEditFaq\(idx\) \{.*?\n\}/s', function($matches) {
    return <<<EOT
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
    localStorage.setItem('mc_policies_config', JSON.stringify(savedPol));
    renderAdminCmsFaqs();
    
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    if (window._isSyncing === undefined) {
        fetch('/api/cms/policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
            body: JSON.stringify(savedPol)
        }).catch(console.error);
    }
}
EOT;
}, $newContent);

// 3. promptAddTestimonial
$newContent = preg_replace_callback('/async function promptAddTestimonial\(\) \{.*?\n\}/s', function($matches) {
    return <<<EOT
async function promptAddTestimonial() {
    const res = await uiCustomForm([
        { id: 'author', label: 'Nama Klien', type: 'text' },
        { id: 'role', label: 'Peran / Jabatan (contoh: Mempelai Wanita)', type: 'text', value: 'Klien' },
        { id: 'text', label: 'Isi Testimoni', type: 'textarea' }
    ], 'Tambah Testimoni Baru');
    if (!res || !res.author || !res.text) return;
    
    let items = getCmsTestimonials();
    items.push({ rating: 5, text: res.text, author: res.author, role: res.role });
    localStorage.setItem('mc_testimonials_config', JSON.stringify(items));
    renderAdminCmsTestimonials();
    
    await apiPost('/cms/testimonials', { testimonials: items });
}
EOT;
}, $newContent);

// 4. promptEditTestimonial
$newContent = preg_replace_callback('/async function promptEditTestimonial\(idx\) \{.*?\n\}/s', function($matches) {
    return <<<EOT
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
    localStorage.setItem('mc_testimonials_config', JSON.stringify(items));
    renderAdminCmsTestimonials();
    
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    if (window._isSyncing === undefined) {
        fetch('/api/cms/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token },
            body: JSON.stringify({ testimonials: items })
        }).catch(console.error);
    }
}
EOT;
}, $newContent);


file_put_contents('public/js/admin-core.js', $newContent);
echo "admin-core.js forms updated successfully\n";
