async function seedData() {
    try {
        console.log('Fetching CSRF token...');
        const resCsrf = await fetch('http://localhost:8000/api/csrf-token');
        const csrfData = await resCsrf.json();
        const token = csrfData.token;
        console.log('Token acquired:', token);

        const pressKitPayload = {
            stageName: 'Arkanza Radja Maulana',
            spesialisasi: 'Professional Master of Ceremony, Host & Moderator',
            tagline: 'Bringing Energy, Precision, and Elegance to Your Stage.',
            bio: 'Praktisi pembawa acara profesional dengan pengalaman lebih dari 5 tahun di berbagai skala panggung nasional dan internasional. Dikenal karena kemampuannya dalam mengendalikan atmosfer acara, menjembatani audiens, dan menyampaikan pesan dengan artikulasi yang jernih serta elegan.',
            pic: 'Arkanza Management (Dinda)',
            wa: '+62 812-3456-7890',
            email: 'booking@radjamaulana.id',
            sosmed: '@radjamaulana.mc',
            domisili: 'Jakarta (Available Nationwide)',
            scope1: '- National & International Conferences\n- Product Launching & Brand Activation\n- Corporate Gala Dinners & Awarding',
            scope2: '- Akad Nikah / Holy Matrimony & Resepsi\n- Lamaran / Engagement\n- Private & Intimate Celebrations',
            scope3: '- Music Festival & Concerts\n- Sport Events & Fun Runs\n- Exhibition, Expo & Roadshow',
            scope4: '- Bilingual Capability (Bahasa Indonesia & English)\n- Adaptif (Regal/Formal, Energic, Interaktif)\n- Crowd Control & Time Management',
            footerNote: 'Video dokumentasi panggung dan foto resolusi tinggi tersedia berdasarkan permintaan ke pihak manajemen.',
            ridersFooter: 'Rider ini bersifat fleksibel dan dapat didiskusikan secara kekeluargaan atau musyawarah tanpa mengurangi standar kualitas.'
        };

        console.log('Seeding Press Kit...');
        const resPk = await fetch('http://localhost:8000/api/cms/presskit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token
            },
            body: JSON.stringify(pressKitPayload)
        });
        
        const pkData = await resPk.json();
        console.log('Press Kit seeded:', pkData.success ? 'Success' : pkData);

        const riders = [
            {
                title: 'Technical Rider (Sistem Audio)',
                notes: '- 1 (satu) buah Mic Wireless Profesional (Shure Axient / Sennheiser ew500 G4 atau setara)\n- 1 (satu) buah Mic Wireless cadangan (standby di FOH)\n- Monitor speaker yang menghadap ke area panggung (jika di atas panggung besar)'
            },
            {
                title: 'Hospitality Rider (Akomodasi & Konsumsi)',
                notes: '- Ruang tunggu privat / VIP Room yang ber-AC dan dekat dengan panggung\n- 1 (satu) box air mineral kemasan kecil bersuhu ruang (tidak dingin)\n- 2 (dua) porsi makanan berat (prasmanan/box) untuk MC & Asisten'
            },
            {
                title: 'Transportasi (Luar Kota)',
                notes: '- Tiket pesawat PP (kelas ekonomi prioritas) untuk 2 orang (MC & Asisten)\n- Penjemputan eksklusif dari Bandara ke Hotel dan Venue acara\n- Akomodasi hotel setara bintang 4/5 (1 Kamar Deluxe / Twin Bed)'
            }
        ];

        console.log('Seeding Riders...');
        for (let i = 0; i < riders.length; i++) {
            const resRider = await fetch('http://localhost:8000/api/cms/riders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify(riders[i])
            });
            const riderData = await resRider.json();
            console.log(`Rider ${i+1} seeded:`, riderData.success ? 'Success' : riderData);
        }

        console.log('Done.');
    } catch (e) {
        console.error('Error seeding data:', e);
    }
}

seedData();
