<?php
$file = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\app\\Http\\Controllers\\CmsApiController.php';
$content = file_get_contents($file);

$search = "if (\$request->has('metadata'))          \$data['metadata'] = json_encode(\$request->input('metadata'));";
$replace = "if (\$request->has('metadata')) {
            \$incomingMeta = \$request->input('metadata');
            \$existingMeta = \$event->metadata ? json_decode(\$event->metadata, true) : [];
            if (!is_array(\$existingMeta)) \$existingMeta = [];
            if (is_array(\$incomingMeta)) {
                \$mergedMeta = array_merge(\$existingMeta, \$incomingMeta);
                \$data['metadata'] = json_encode(\$mergedMeta);
            } else {
                \$data['metadata'] = json_encode(\$incomingMeta);
            }
        }";
$content = str_replace($search, $replace, $content);

$search2 = "\$inputMeta['payment_history'] = \$history;
                \$data['metadata'] = json_encode(\$inputMeta);";
$replace2 = "
                // Fix: Merge into the already merged metadata, not just the input meta
                \$mergedForPayment = json_decode(\$data['metadata'], true) ?: [];
                \$mergedForPayment['payment_history'] = \$history;
                \$data['metadata'] = json_encode(\$mergedForPayment);";
$content = str_replace($search2, $replace2, $content);

file_put_contents($file, $content);
echo "Patched CmsApiController.php successfully!";
