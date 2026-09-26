const fs = require('fs');

const pieFunc = `
window.renderDashboardPies = function() {
    // Event Category Pie (Dashboard)
    const svg = document.getElementById('dashProporsiSvg');
    const legend = document.getElementById('dashProporsiLegend');
    if (svg && legend) {
        const counts = {};
        let total = 0;
        (window.mcCustomers || []).forEach(c => {
            const cat = c.category || 'Wedding';
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });

        if (total === 0) {
            svg.innerHTML = '<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#555" stroke-width="1" stroke-dasharray="3.14159 3.14159" />';
            legend.innerHTML = '<div style="text-align:center;">Belum ada data</div>';
        } else {
            const colors = ['#D4AF37', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
            let htmlSvg = '';
            let htmlLegend = '';
            let currentOffset = 0;
            const circumference = Math.PI; 
            
            Object.keys(counts).forEach((cat, idx) => {
                const count = counts[cat];
                const perc = count / total;
                const strokeLength = perc * circumference;
                const color = colors[idx % colors.length];
                htmlSvg += \`<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="\${color}" stroke-width="1" stroke-dasharray="\${strokeLength} \${circumference}" stroke-dashoffset="\${-currentOffset}" />\`;
                htmlLegend += \`<div style="display:flex; justify-content:space-between;"><span style="color:\${color}; font-weight:600;"> \${cat}</span> <span>\${Math.round(perc * 100)}%</span></div>\`;
                currentOffset += strokeLength;
            });
            svg.innerHTML = htmlSvg;
            legend.innerHTML = htmlLegend;
        }
    }
    
    // Income Proportion Pie (Dashboard) - if needed based on cashflow or just mock for now
    const incSvg = document.getElementById('dashIncomeProporsiSvg');
    const incLeg = document.getElementById('dashIncomeProporsiLegend');
    if (incSvg && incLeg) {
         // Since income is often fetched from cashflow, we'll try to read it from window.mcCashflow
         let totalInc = 0;
         const incCounts = {};
         (window.mcCashflow || []).forEach(tx => {
             if (tx.type === 'income') {
                 const c = tx.category || 'Lainnya';
                 incCounts[c] = (incCounts[c] || 0) + (tx.amount || 0);
                 totalInc += (tx.amount || 0);
             }
         });
         
         if (totalInc === 0) {
             incSvg.innerHTML = '<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#555" stroke-width="1" stroke-dasharray="3.14159 3.14159" />';
             incLeg.innerHTML = '<div style="text-align:center;">Belum ada data</div>';
         } else {
             const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
             let htmlSvg = '';
             let htmlLegend = '';
             let currentOffset = 0;
             const circumference = Math.PI; 
             
             Object.keys(incCounts).forEach((cat, idx) => {
                 const amt = incCounts[cat];
                 const perc = amt / totalInc;
                 const strokeLength = perc * circumference;
                 const color = colors[idx % colors.length];
                 htmlSvg += \`<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="\${color}" stroke-width="1" stroke-dasharray="\${strokeLength} \${circumference}" stroke-dashoffset="\${-currentOffset}" />\`;
                 htmlLegend += \`<div style="display:flex; justify-content:space-between;"><span style="color:\${color}; font-weight:600;"> \${cat}</span> <span>\${Math.round(perc * 100)}%</span></div>\`;
                 currentOffset += strokeLength;
             });
             incSvg.innerHTML = htmlSvg;
             incLeg.innerHTML = htmlLegend;
         }
    }
};
`;

function appendFunction(filePath) {
    if (!fs.existsSync(filePath)) return;
    let js = fs.readFileSync(filePath, 'utf8');
    if (!js.includes('window.renderDashboardPies = function()')) {
        fs.appendFileSync(filePath, '\n' + pieFunc, 'utf8');
    }
}

appendFunction('public/js/customers.js');
appendFunction('public/js/bundle-test.js');
console.log('Appended renderDashboardPies');
