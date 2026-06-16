const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const md5 = require('md5');

// ==========================================
// ⚙️ PENGATURAN KEUNTUNGAN (EDIT DISINI)
// ==========================================
// Mau untung berapa persen? (Contoh: 5% = 0.05)
// Kalau Modal 100.000, Jual jadi 105.000
const KEUNTUNGAN_PERSEN = 0.04; 

// ==========================================
// DATA RAHASIA (Sama kayak bot.js)
// ==========================================
const SUPABASE_URL = 'https://api.yudhiyo-tecno.com';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MTUxODMyMCwiZXhwIjo0OTM3MTkxOTIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.S7OF-MLTzk0kbc3CpR_74UBSaCkc6F_Ncq__8c0Qt6w';
const USERNAME_DIGI = 'cosilaWmn3Lg'.trim(); 
const KEY_DIGI = 'd7e119ac-abf4-5083-a26a-89e32fba583b'.trim(); 

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function mulaiUpdate() {
    console.log("⏳ Sedang mengambil data harga terbaru dari Digiflazz...");
    
    try {
        // 1. AMBIL PRICELIST DARI DIGIFLAZZ
        const sign = md5(USERNAME_DIGI + KEY_DIGI + "pricelist");
        const resDigi = await axios.post('https://api.digiflazz.com/v1/price-list', {
            cmd: 'prepaid',
            username: USERNAME_DIGI,
            sign: sign
        });

        const listDigi = resDigi.data.data;
        if (!listDigi) { console.log("❌ Gagal ambil data Digi"); return; }

        console.log(`✅ Dapat ${listDigi.length} produk dari Digiflazz.`);

        // 2. AMBIL PRODUK DARI DATABASE KITA
        const { data: produkKita } = await db.from('products_store').select('*');
        
        console.log(`🔍 Mengecek ${produkKita.length} produk di toko Abang...`);
        console.log("---------------------------------------------------");

        let jumlahDiupdate = 0;

        // 3. LOOPING & COCOKKAN
        for (let barang of produkKita) {
            // Cari barang yang SKU-nya sama
            const dataBaru = listDigi.find(d => d.buyer_sku_code === barang.sku_provider);

            if (dataBaru) {
                const modalBaru = dataBaru.price;
                
                // 🔥 RUMUS HARGA JUAL OTOMATIS 🔥
                // Harga Jual = Modal + (Modal * Persen)
                let jualBaru = modalBaru + (modalBaru * KEUNTUNGAN_PERSEN);

                // Pembulatan ke 100 perak terdekat biar rapi (Opsional)
                // Contoh: 10.123 jadi 10.200
                jualBaru = Math.ceil(jualBaru / 100) * 100;

                // Cek apakah harga berubah? Biar gak spam update
                if (modalBaru !== barang.price_buy || jualBaru !== barang.price_sell) {
                    
                    // UPDATE DATABASE
                    await db.from('products_store').update({
                        price_buy: modalBaru,
                        price_sell: jualBaru
                    }).eq('id', barang.id);

                    console.log(`✅ UPDATE: ${barang.name}`);
                    console.log(`   💰 Modal: ${barang.price_buy} -> ${modalBaru}`);
                    console.log(`   🏷️ Jual : ${barang.price_sell} -> ${jualBaru}`);
                    jumlahDiupdate++;
                }
            }
        }

        console.log("---------------------------------------------------");
        console.log(`🎉 SELESAI! Total ${jumlahDiupdate} produk berhasil diupdate harganya.`);

    } catch (err) {
        console.log("❌ ERROR:", err.message);
    }
}

// Jalankan Fungsi
mulaiUpdate();
