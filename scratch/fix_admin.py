import sys
import re

with open('public/js/admin-core.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix 1: The duplicate block. The file has "const savedCal = localStorage.getItem('mc_calendar_widget_config');" twice.
# Let's split by that string.
parts = text.split("const savedCal = localStorage.getItem('mc_calendar_widget_config');")
if len(parts) >= 3:
    print(f"Found {len(parts)} parts, splitting on savedCal...")
    # part 0 is everything before the first one
    # part 1 is the duplicated junk
    # part 2 is the actual rest of the file
    
    fixed_text = parts[0] + "const savedCal = localStorage.getItem('mc_calendar_widget_config');" + parts[2]
    
    # We also need to restore handleSaveCmsPolicies.
    # Where does it go? Usually right before handleSavePressKitConfig, which is also missing?
    # Let's check if handleSavePressKitConfig is in fixed_text.
    if "function handleSavePressKitConfig" not in fixed_text:
        # It's missing! 
        print("handleSavePressKitConfig is missing, restoring both functions...")
        
        # We can append them after deleteCmsTestimonial
        insert_pos = fixed_text.find('window.deleteCmsTestimonial = deleteCmsTestimonial;')
        if insert_pos != -1:
            insert_point = insert_pos + len('window.deleteCmsTestimonial = deleteCmsTestimonial;')
            
            functions_to_add = """

async function handleSaveCmsPolicies(e) {
    e.preventDefault();
    const terms = document.getElementById('cmsTermsText').value;
    const refund = document.getElementById('cmsRefundText').value;
    const riders = document.getElementById('cmsRidersText').value;

    const faqs = getCmsFaqs(); // keep existing faqs

    const dataPol = { terms, refund, riders, faqs };
    localStorage.setItem('mc_policies_config', JSON.stringify(dataPol));
    
    const btn = e.target.querySelector('button[type="submit"]') || e.submitter;
    const originalText = btn ? btn.textContent : 'Simpan';
    if (btn) { btn.disabled = true; btn.textContent = 'Menyimpan...'; }

    try {
        await apiPost('/cms/policies', dataPol);
        await apiPost('/cms/testimonials', { testimonials: getCmsTestimonials() });
        
        if (window.SyncEngine) {
            window.SyncEngine.push('/api/cms/policies', dataPol);
            window.SyncEngine.push('/api/cms/testimonials', { testimonials: getCmsTestimonials() });
        }
        
        if(typeof showToast === 'function') showToast('Syarat & Ketentuan (T&C), Refund Policy, Riders, FAQ & Testimoni berhasil disimpan ke database!', 'gold');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalText; }
    }
}
window.handleSaveCmsPolicies = handleSaveCmsPolicies;

function handleSavePressKitConfig(e) {
    e.preventDefault();
    const title = document.getElementById('pressKitTitle').value;
    const url = document.getElementById('pressKitUrl').value;
    const note = document.getElementById('pressKitRidersNote').value;

    localStorage.setItem('mc_presskit_config', JSON.stringify({ title, url, note }));
    showToast('Pengaturan Press Kit & Riders panggung berhasil disimpan!', 'gold');
}
window.handleSavePressKitConfig = handleSavePressKitConfig;

function testDownloadPressKit() {
    const url = document.getElementById('pressKitUrl').value;
    window.open(url, '_blank');
    showToast('Membuka pratinjau berkas Press Kit PDF...', 'gold');
}
window.testDownloadPressKit = testDownloadPressKit;
"""
            fixed_text = fixed_text[:insert_point] + functions_to_add + fixed_text[insert_point:]
        else:
            print("Could not find window.deleteCmsTestimonial = deleteCmsTestimonial;")
    else:
        print("handleSavePressKitConfig is present.")
        
    with open('public/js/admin-core.js', 'w', encoding='utf-8') as out:
        out.write(fixed_text)
    print("Fix applied successfully!")
else:
    print(f"Could not find exact duplication pattern. Found {len(parts)} parts.")

