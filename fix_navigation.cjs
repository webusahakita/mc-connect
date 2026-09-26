const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Replace the broken navigateToSection with one that uses .active class
let oldFunc = js.match(/\/\/ Navigation function[\s\S]*?window\.navigateToSection = navigateToSection;\n/);
if (oldFunc) {
    let replacement = `// Navigation function - switches between admin sections
function navigateToSection(sectionId, menuElement) {
    // Remove active class from all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Add active class to target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update active menu in sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('topbarBreadcrumb');
    if (breadcrumb && typeof sectionBreadcrumbMap !== 'undefined' && sectionBreadcrumbMap[sectionId]) {
        breadcrumb.textContent = sectionBreadcrumbMap[sectionId];
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Section-specific initialization
    if (sectionId === 'sec-customers' && typeof window.initCustomersPage === 'function') {
        window.initCustomersPage();
    }
    if (sectionId === 'sec-customers' && typeof window.loadCustomersData === 'function') {
        window.loadCustomersData();
    }
    if (sectionId === 'sec-command-center' && typeof window.loadActiveEventInCommandCenter === 'function') {
        window.loadActiveEventInCommandCenter();
    }
    if (sectionId === 'sec-dashboard' && typeof renderDashEvents === 'function') {
        renderDashEvents();
    }
    if (sectionId === 'sec-wardrobe' && typeof renderWardrobe === 'function') {
        renderWardrobe();
    }
    if (sectionId === 'sec-cashflow' && typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.navigateToSection = navigateToSection;
`;
    js = js.replace(oldFunc[0], replacement);
    console.log('Replaced navigateToSection function');
} else {
    console.log('Could not find old navigateToSection');
    // Try finding it by function name
    let funcIdx = js.indexOf('function navigateToSection(');
    if (funcIdx !== -1) {
        // Find the end of the function
        let braces = 0;
        let funcEnd = funcIdx;
        let started = false;
        for (let i = funcIdx; i < js.length; i++) {
            if (js[i] === '{') { braces++; started = true; }
            if (js[i] === '}') { braces--; }
            if (started && braces === 0) { funcEnd = i + 1; break; }
        }
        // Also find window.navigateToSection assignment
        let assignIdx = js.indexOf('window.navigateToSection', funcEnd);
        if (assignIdx !== -1 && assignIdx < funcEnd + 100) {
            funcEnd = js.indexOf('\n', assignIdx) + 1;
        }
        
        let replacement = `function navigateToSection(sectionId, menuElement) {
    // Remove active class from all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Add active class to target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update active menu in sidebar
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('topbarBreadcrumb');
    if (breadcrumb && typeof sectionBreadcrumbMap !== 'undefined' && sectionBreadcrumbMap[sectionId]) {
        breadcrumb.textContent = sectionBreadcrumbMap[sectionId];
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Section-specific initialization
    if (sectionId === 'sec-customers' && typeof window.initCustomersPage === 'function') {
        window.initCustomersPage();
    }
    if (sectionId === 'sec-customers' && typeof window.loadCustomersData === 'function') {
        window.loadCustomersData();
    }
    if (sectionId === 'sec-command-center' && typeof window.loadActiveEventInCommandCenter === 'function') {
        window.loadActiveEventInCommandCenter();
    }
    if (sectionId === 'sec-dashboard' && typeof renderDashEvents === 'function') {
        renderDashEvents();
    }
    if (sectionId === 'sec-wardrobe' && typeof renderWardrobe === 'function') {
        renderWardrobe();
    }
    if (sectionId === 'sec-cashflow' && typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.navigateToSection = navigateToSection;
`;
        js = js.substring(0, funcIdx) + replacement + js.substring(funcEnd);
        console.log('Replaced navigateToSection (method 2)');
    }
}

// Also fix the DOMContentLoaded to navigate to dashboard initially
// The initial state might be wrong - sec-calendar has "active" but should be sec-dashboard
let domBlock = js.substring(js.lastIndexOf("document.addEventListener('DOMContentLoaded'"));
if (!domBlock.includes("navigateToSection('sec-dashboard'")) {
    // Already has it from earlier fix, check
    console.log('DOMContentLoaded initial navigation check...');
}

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('admin-core.js saved');

// Also fix admin.html - make sec-dashboard the initially active section (not sec-calendar)
let html = fs.readFileSync('public/admin.html', 'utf8');
// Remove active from all sections first
html = html.replace(/class="admin-section active"/g, 'class="admin-section"');
// Set dashboard as active
html = html.replace('id="sec-dashboard" class="admin-section"', 'id="sec-dashboard" class="admin-section active"');
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Set sec-dashboard as default active section');
