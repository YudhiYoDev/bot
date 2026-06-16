const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const md5 = require('md5');

// ==========================================
// ⚙️ SETTING IMPORT (GANTI INI TIAP MAU NAMBAH GAME)
// ==========================================
const BRAND_DIGI = 'Magic Chess'; // Nama Brand persis di Digiflazz (Huruf Besar)
const GAME_ID_KITA = '3457d56f-042a-455e-9c8b-12d079aa70c7'; // ID Game di database Supabase Abang (Liat di Tabel 'games')
const KEUNTUNGAN = 0.04; // Untung 5%

// ==========================================
// DATA RAHASIA
// ==========================================
const SUPABASE_URL = 'https://jpavxamzswrnbtepsozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYXZ4YW16c3dybmJ0ZXBzb3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjY1OSwiZXhwIjoyMDg4OTg4NjU5fQ.2TCWS9aFBeecSx9lrJWegtdCARR8od-cCAX4BZ4HFCU';
const USERNAME_DIGI = 'cosilaWmn3Lg'.trim(); 
const KEY_DIGI = 'd7e119ac-abf4-5083-a26a-89e32fba583b'.trim(); 

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importProduk() {
    console.log(`⏳ Sedang mencari produk '${BRAND_DIGI}' di Digiflazz...`);
    
    try {
        // 1. AMBIL PRICELIST
        const sign = md5(USERNAME_DIGI + KEY_DIGI + "pricelist");
        const res = await axios.post('https://api.digiflazz.com/v1/price-list', {
            cmd: 'prepaid',
            username: USERNAME_DIGI,
            sign: sign
        });

        const semuaProduk = res.data.data;
        
        // 2. FILTER CUMA BRAND YANG DIMINTA
        const produkPilihan = semuaProduk.filter(p => p.brand === BRAND_DIGI);

        if (produkPilihan.length === 0) {
            console.log("❌ GAK KETEMU! Cek lagi nama brand-nya (Harus persis).");
            return;
        }

        console.log(`✅ Ditemukan ${produkPilihan.length} item. Mulai import...`);

        // 3. MASUKKAN KE DATABASE
        let berhasil = 0;
        for (let item of produkPilihan) {
            
            // Hitung Harga Jual
            let modal = item.price;
            let jual = Math.ceil((modal + (modal * KEUNTUNGAN)) / 100) * 100;

            // Masukkan ke Supabase
            const { error } = await db.from('products').insert({
                game_id: GAME_ID_KITA,
                name: item.product_name,
                sku_provider: item.buyer_sku_code,
                price_buy: modal,
                price_sell: jual,
                is_active: true // Langsung aktif
            });

            if (!error) {
                console.log(`📦 Masuk: ${item.product_name} (Rp ${jual})`);
                berhasil++;
            } else {
                console.log(`⚠️ Gagal: ${item.product_name} (Mungkin SKU kembar)`);
            }
        }

        console.log("-----------------------------------------");
        console.log(`🎉 SUKSES IMPORT ${berhasil} PRODUK!`);

    } catch (err) {
        console.log("❌ ERROR:", err.message);
    }
}

importProduk();
