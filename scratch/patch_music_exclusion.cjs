const fs = require('fs');
const file = 'public/js/admin-core.js';
let code = fs.readFileSync(file, 'utf8');

const targetStr = "const result = await window.uiFormModal(editItem ? 'Edit Lagu Acara' : 'Tambah Lagu Acara (Terintegrasi)', fields);";

const mutualExclusionLogic = `
      setTimeout(() => {
          const linkInput = document.getElementById('url_link');
          const fileInput = document.getElementById('file_upload');
          if (linkInput && fileInput) {
              if (linkInput.value.trim() !== '') {
                  fileInput.disabled = true;
                  fileInput.parentElement.style.opacity = '0.5';
              }
              linkInput.addEventListener('input', () => {
                  if (linkInput.value.trim() !== '') {
                      fileInput.disabled = true;
                      fileInput.parentElement.style.opacity = '0.5';
                      fileInput.title = 'Hapus URL link terlebih dahulu untuk upload file';
                  } else {
                      fileInput.disabled = false;
                      fileInput.parentElement.style.opacity = '1';
                      fileInput.title = '';
                  }
              });
              fileInput.addEventListener('change', () => {
                  if (fileInput.files.length > 0) {
                      linkInput.disabled = true;
                      linkInput.value = '';
                      linkInput.parentElement.style.opacity = '0.5';
                      linkInput.placeholder = 'Hapus file untuk mengisi link URL';
                  } else {
                      linkInput.disabled = false;
                      linkInput.parentElement.style.opacity = '1';
                      linkInput.placeholder = '';
                  }
              });
          }
      }, 100);
      const result = await window.uiFormModal(editItem ? 'Edit Lagu Acara' : 'Tambah Lagu Acara (Terintegrasi)', fields);`;

code = code.replace(targetStr, mutualExclusionLogic);
fs.writeFileSync(file, code);
console.log('Added mutual exclusion logic for music upload');
