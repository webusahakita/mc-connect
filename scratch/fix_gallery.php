<?php
$content = file_get_contents('public/js/admin-core.js');

$correct_func = <<<EOT
function handleMultipleGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (typeof showToast !== 'undefined') showToast(`Mengunggah \${files.length} foto ke server...`, 'gold');

    const formData = new FormData();
    Array.from(files).forEach((file, index) => {
        formData.append('files[]', file);
    });

    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    
    fetch('/api/cms/gallery/upload', {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': token,
            'Accept': 'application/json'
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            let items = getAdminGalleryData();
            
            data.data.forEach(uploaded => {
                items.push({
                    id: uploaded.id,
                    url: uploaded.url,
                    caption: uploaded.caption
                });
            });
            
            saveAdminGalleryData(items);
            renderAdminGallery();
            if (typeof showToast !== 'undefined') showToast(`\${files.length} foto berhasil diunggah dan disimpan!`, 'green');
        } else {
            console.error('Upload failed:', data);
            if (typeof showToast !== 'undefined') showToast('Gagal mengunggah foto. Pastikan ukuran file tidak terlalu besar.', 'red');
        }
    })
    .catch(err => {
        console.error('Upload error:', err);
        if (typeof showToast !== 'undefined') showToast('Terjadi kesalahan saat mengunggah foto.', 'red');
    })
    .finally(() => {
        event.target.value = ''; // reset input
    });
}
EOT;

// Find the start of the function
$startPos = strpos($content, 'function handleMultipleGalleryUpload(event) {');
// Find the end of the function (before window.handleMultipleGalleryUpload =)
$endPos = strpos($content, 'window.handleMultipleGalleryUpload = handleMultipleGalleryUpload;');

if ($startPos !== false && $endPos !== false) {
    $before = substr($content, 0, $startPos);
    $after = substr($content, $endPos);
    file_put_contents('public/js/admin-core.js', $before . $correct_func . "\n" . $after);
    echo "Fixed handleMultipleGalleryUpload\n";
} else {
    echo "Could not find function bounds\n";
}
