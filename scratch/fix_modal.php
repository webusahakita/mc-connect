<?php
$content = file_get_contents('public/js/custom-modal.js');

$newContent = str_replace(
    '<input type="text" id="customModalInput" class="custom-modal-input" style="display:none;">',
    '<input type="text" id="customModalInput" class="custom-modal-input" style="display:none;">'."\n".'            <div id="customModalFormContainer" style="display:none; text-align:left; margin-bottom:1.5rem; max-height:60vh; overflow-y:auto; padding-right:5px;"></div>',
    $content
);

$newContent = str_replace(
    "function showModal({ title = 'Perhatian', message, type = 'alert', defaultText = '' }) {",
    "function showModal({ title = 'Perhatian', message = '', type = 'alert', defaultText = '', fields = [] }) {",
    $newContent
);

$newContent = str_replace(
    "const inputEl = document.getElementById('customModalInput');",
    "const inputEl = document.getElementById('customModalInput');\n        const formContainer = document.getElementById('customModalFormContainer');",
    $newContent
);

$newContent = str_replace(
    "inputEl.style.display = type === 'prompt' ? 'block' : 'none';",
    "inputEl.style.display = type === 'prompt' ? 'block' : 'none';\n        formContainer.style.display = type === 'form' ? 'block' : 'none';\n        messageEl.style.display = message ? 'block' : 'none';",
    $newContent
);

$formLogic = <<<EOT
        if (type === 'form') {
            formContainer.innerHTML = '';
            fields.forEach(field => {
                const wrapper = document.createElement('div');
                wrapper.style.marginBottom = '1rem';
                
                const label = document.createElement('label');
                label.textContent = field.label;
                label.style.display = 'block';
                label.style.marginBottom = '0.5rem';
                label.style.color = 'var(--gold-primary, #D4AF37)';
                label.style.fontSize = '0.9rem';
                
                let input;
                if (field.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.rows = 4;
                } else {
                    input = document.createElement('input');
                    input.type = field.type || 'text';
                }
                input.id = 'cm_field_' + field.id;
                input.className = 'custom-modal-input';
                input.style.marginBottom = '0';
                input.value = field.value || '';
                
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                formContainer.appendChild(wrapper);
            });
        }
EOT;

$newContent = str_replace(
    "if (type === 'prompt') {",
    $formLogic . "\n        if (type === 'prompt') {",
    $newContent
);

$resolveLogic = <<<EOT
            if (type === 'prompt') {
                resolve(inputEl.value);
            } else if (type === 'form') {
                const result = {};
                fields.forEach(f => {
                    result[f.id] = document.getElementById('cm_field_' + f.id).value;
                });
                resolve(result);
            } else {
                resolve(true);
            }
EOT;

$newContent = preg_replace("/if \(type === 'prompt'\) \{\s*resolve\(inputEl\.value\);\s*\} else \{\s*resolve\(true\);\s*\}/", $resolveLogic, $newContent);

$exportLogic = <<<EOT
window.uiCustomForm = (fields, title = 'Input Diperlukan') => {
    return showModal({ type: 'form', fields, title });
};
EOT;

$newContent .= "\n" . $exportLogic . "\n";

file_put_contents('public/js/custom-modal.js', $newContent);
echo "custom-modal.js patched successfully\n";
