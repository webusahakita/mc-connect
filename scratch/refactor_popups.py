import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to find all instances of uiConfirm and uiPrompt without await
    # and add await. Then we trace backwards to find the nearest function declaration
    # and add async to it if it doesn't have it.
    
    # 1. Add await to uiConfirm and uiPrompt
    content = re.sub(r'(?<!await\s)uiConfirm\(', 'await uiConfirm(', content)
    content = re.sub(r'(?<!await\s)uiPrompt\(', 'await uiPrompt(', content)

    # 2. To add async to the nearest function, it's a bit tricky with pure regex.
    # We will find all lines with 'await' and make sure their enclosing function is async.
    # Instead of complex AST, let's just do known replacements for these 20 functions.
    
    replacements = {
        "function handleLogout(e)": "async function handleLogout(e)",
        "function togglePublicPackage(btn, isPublic)": "async function togglePublicPackage(btn, isPublic)",
        "function deletePackage(idx)": "async function deletePackage(idx)",
        "function deleteWardrobeItem(id)": "async function deleteWardrobeItem(id)",
        "function handleRemoveWardrobeFromEvent(e)": "async function handleRemoveWardrobeFromEvent(e)",
        "function addCashflowExpense()": "async function addCashflowExpense()",
        "function deleteRundownItem(id)": "async function deleteRundownItem(id)",
        "function resetRundownTemplate(evId)": "async function resetRundownTemplate(evId)",
        "function deletePlaylistItem(id)": "async function deletePlaylistItem(id)",
        "function resetPlaylistTemplate(evId)": "async function resetPlaylistTemplate(evId)",
        "function deleteSoundboardItem(id)": "async function deleteSoundboardItem(id)",
        "function resetSoundboardTemplate(evId)": "async function resetSoundboardTemplate(evId)",
        "promptAddCmsGallery() {": "async promptAddCmsGallery() {",
        "deleteCmsGallery(idx) {": "async deleteCmsGallery(idx) {",
        "deleteCashflowCategory(id) {": "async deleteCashflowCategory(id) {",
        "function deleteCmsRider(id)": "async function deleteCmsRider(id)",
        "function deleteCmsGalleryItem(id)": "async function deleteCmsGalleryItem(id)",
        "function quickHandleConflict()": "async function quickHandleConflict()",
    }
    
    for old, new_ in replacements.items():
        if "async " + old not in content and old in content:
            content = content.replace(old, new_)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Done refactoring popups.")

process_file(r'c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\public\js\admin-core.js')
