<?php
$file = __DIR__ . '/../public/js/admin-core.js';
$content = file_get_contents($file);

// 1. Add await to uiConfirm and uiPrompt
$content = preg_replace('/(?<!await\s)uiConfirm\(/', 'await uiConfirm(', $content);
$content = preg_replace('/(?<!await\s)uiPrompt\(/', 'await uiPrompt(', $content);

// 2. Add async to known functions
$replacements = [
    "function handleLogout(e)" => "async function handleLogout(e)",
    "function togglePublicPackage(btn, isPublic)" => "async function togglePublicPackage(btn, isPublic)",
    "function deletePackage(idx)" => "async function deletePackage(idx)",
    "function deleteWardrobeItem(id)" => "async function deleteWardrobeItem(id)",
    "function handleRemoveWardrobeFromEvent(e)" => "async function handleRemoveWardrobeFromEvent(e)",
    "function addCashflowExpense()" => "async function addCashflowExpense()",
    "function deleteRundownItem(id)" => "async function deleteRundownItem(id)",
    "function resetRundownTemplate(evId)" => "async function resetRundownTemplate(evId)",
    "function deletePlaylistItem(id)" => "async function deletePlaylistItem(id)",
    "function resetPlaylistTemplate(evId)" => "async function resetPlaylistTemplate(evId)",
    "function deleteSoundboardItem(id)" => "async function deleteSoundboardItem(id)",
    "function resetSoundboardTemplate(evId)" => "async function resetSoundboardTemplate(evId)",
    "promptAddCmsGallery() {" => "async promptAddCmsGallery() {",
    "deleteCmsGallery(idx) {" => "async deleteCmsGallery(idx) {",
    "deleteCashflowCategory(id) {" => "async deleteCashflowCategory(id) {",
    "function deleteCmsRider(id)" => "async function deleteCmsRider(id)",
    "function deleteCmsGalleryItem(id)" => "async function deleteCmsGalleryItem(id)",
    "function quickHandleConflict()" => "async function quickHandleConflict()",
];

foreach ($replacements as $old => $new) {
    if (strpos($content, "async " . $old) === false) {
        $content = str_replace($old, $new, $content);
    }
}

file_put_contents($file, $content);
echo "PHP Refactoring done.\n";
