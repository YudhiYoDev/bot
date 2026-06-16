const axios = require('axios');
const md5 = require('md5');

// 1. MASUKKAN USERNAME (JANGAN DIUBAH LAGI, INI SUDAH BENAR)
// Kita tambah .trim() biar kalau ada spasi gak sengaja, langsung dibuang robot.
const username = 'cosilaWmn3Lg'.trim();

// 2. MASUKKAN API KEY BARU (HASIL REGENERATE TERAKHIR)
// Copy paste di dalam tanda petik.
const apiKey = 'd7e119ac-abf4-5083-a26a-89e32fba583b'.trim(); 

// ---------------------------------------------------------

async function tesTembak() {
    console.log("🚀 MENCOBA TEMBAK DIGIFLAZZ (VERSI ANTI SPASI)...");

    const skuBenar = 'MobileLegends_5'; 
    const idTujuan = '123456782024'; 
    const refId = 'TES-' + Math.floor(Math.random() * 100000); // RefID Acak
    
    // RUMUS SIGNATURE
    const sign = md5(username + apiKey + refId);

    console.log("📝 Data Bersih:");
    console.log("User:", username); 
    console.log("Ref :", refId);

    try {
        const res = await axios.post('https://api.digiflazz.com/v1/transaction', {
            username: username,
            buyer_sku_code: skuBenar,
            customer_no: idTujuan,
            ref_id: refId,
            sign: sign,
            testing: true
        });

        console.log("✅ SUKSES TEMBUS BENTENG!");
        console.log("Respon:", res.data);

    } catch (err) {
        console.log("❌ HASIL:");
        if (err.response) {
            console.log(JSON.stringify(err.response.data, null, 2));
        } else {
            console.log(err.message);
        }
    }
}

tesTembak();
