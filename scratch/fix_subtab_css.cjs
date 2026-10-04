const fs = require('fs');
const file = 'public/admin.html';
let html = fs.readFileSync(file, 'utf8');

const target = '<div class="music-subtab-bar">';
if (!html.includes('<style id="musicSubtabStyles">')) {
    const style = `
<style id="musicSubtabStyles">
.music-subtab-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    background: rgba(0, 0, 0, 0.5);
    padding: 0.5rem;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
}
.music-subtab-btn {
    background: transparent !important;
    border: none !important;
    color: var(--adm-text-secondary) !important;
    padding: 0.6rem 1.25rem !important;
    border-radius: 10px !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.music-subtab-btn:hover {
    color: #FFF !important;
    background: rgba(255, 255, 255, 0.08) !important;
}
.music-subtab-btn.active {
    background: linear-gradient(135deg, var(--adm-gold), #FDE047) !important;
    color: #1E293B !important;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4) !important;
}
.music-subtab-btn.active .badge {
    background: rgba(0, 0, 0, 0.15) !important;
    color: #000 !important;
    border: 1px solid rgba(0,0,0,0.1);
}
</style>
`;
    html = html.replace(target, style + target);
    fs.writeFileSync(file, html);
    console.log('Applied subtab styles');
} else {
    console.log('Styles already exist');
}
