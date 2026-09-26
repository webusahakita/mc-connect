function navigateToSection(sectionId, btnElement) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // Remove active from all sidebar buttons
    const btns = document.querySelectorAll('.sidebar-item-btn');
    btns.forEach(btn => btn.classList.remove('active'));

    // Show target section
    const targetSec = document.getElementById(sectionId);
    if (targetSec) targetSec.classList.add('active');

    // Set active on clicked button
    if (btnElement) {
        btnElement.classList.add('active');
    }
}
window.navigateToSection = navigateToSection;
