<?php
$file = __DIR__ . '/../public/js/admin-core.js';
$c = file_get_contents($file);

$replacements = [
    "function togglePublicPackage(btn" => "async function togglePublicPackage(btn",
    "function promptAddFaq(" => "async function promptAddFaq(",
    "function deleteCmsFaq(" => "async function deleteCmsFaq(",
    "function promptAddTestimonial(" => "async function promptAddTestimonial(",
    "function deleteCmsTestimonial(" => "async function deleteCmsTestimonial(",
    "function deletePackage(" => "async function deletePackage(",
    "function deleteWardrobe(" => "async function deleteWardrobe(",
    "function unassignWardrobe(" => "async function unassignWardrobe(",
    "function promptAddExpense(" => "async function promptAddExpense(",
    "function deleteRundownItem(" => "async function deleteRundownItem(",
    "function resetCurrentEventRundown(" => "async function resetCurrentEventRundown(",
    "function deleteMusic(" => "async function deleteMusic(",
    "function resetCurrentEventMusic(" => "async function resetCurrentEventMusic(",
    "function deleteSoundboard(" => "async function deleteSoundboard(",
    "function resetCurrentEventSoundboard(" => "async function resetCurrentEventSoundboard(",
    "function promptAddGalleryItem(" => "async function promptAddGalleryItem(",
    "function deleteGalleryItem(" => "async function deleteGalleryItem(",
    "function deleteCashflowCategory(" => "async function deleteCashflowCategory(",
    "function deleteRider(" => "async function deleteRider(",
    "function saveCmsTestimonials(" => "async function saveCmsTestimonials(",
    "function saveCmsFaq(" => "async function saveCmsFaq(",
];

foreach ($replacements as $old => $new) {
    if (strpos($c, "async " . $old) === false) {
        $c = str_replace($old, $new, $c);
    }
}
file_put_contents($file, $c);
echo "Fixed missing asyncs in admin-core.js\n";
