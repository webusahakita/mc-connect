const fs = require('fs');

function fixCustomersJs(filePath) {
    if (!fs.existsSync(filePath)) return;
    let js = fs.readFileSync(filePath, 'utf8');

    // 1. Fix loadCustomersData to fetch categories
    const oldLoad = /async function loadCustomersData\(\) \{[\s\S]*?renderCustomersTable\(\);\s*\}/;
    const newLoad = `async function loadCustomersData() {
        try {
            const resCats = await Promise.all([
                fetch('/api/cms/event-categories').then(r=>r.json()).catch(()=>({})),
                fetch('/api/cms/client-categories').then(r=>r.json()).catch(()=>({}))
            ]);
            window.currentEventCategories = resCats[0]?.data || [];
            window.currentClientCategories = resCats[1]?.data || [];
            
            const res = await fetch('/api/cms/customers');
            const json = await res.json();
            if (json.success && json.data) {
                mcCustomers = json.data;
                window.mcCustomers = mcCustomers;
                mcCustomers.forEach(c => { if(c.id && !c._dbId) c._dbId = c.id; });
            }
        } catch(e) {
            console.warn("Gagal mengambil data dari server", e);
        }
        renderCustomersTable();
        if (typeof window.renderDashboardPies === 'function') window.renderDashboardPies();
    }`;
    js = js.replace(oldLoad, newLoad);

    // 2. Export renderDashboardPies
    if (!js.includes('window.renderDashboardPies')) {
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
        js = js.replace('})();', pieFunc + '\n})();');
    }

    fs.writeFileSync(filePath, js, 'utf8');
}

fixCustomersJs('public/js/customers.js');
fixCustomersJs('public/js/bundle-test.js');
console.log('Fixed loadCustomersData and dashboard pie charts');
