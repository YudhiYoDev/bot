const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const md5 = require('md5');

// ==================================================
// 1. DATA RAHASIA
// ==================================================
const SUPABASE_URL = 'https://jpavxamzswrnbtepsozo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYXZ4YW16c3dybmJ0ZXBzb3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjY1OSwiZXhwIjoyMDg4OTg4NjU5fQ.2TCWS9aFBeecSx9lrJWegtdCARR8od-cCAX4BZ4HFCU';

const USERNAME_DIGI = 'cosilaWmn3Lg'.trim(); 
const KEY_DIGI = 'd7e119ac-abf4-5083-a26a-89e32fba583b'.trim(); 

// 🔥 DATA TELEGRAM ABANG 🔥
const TELEGRAM_TOKEN = '8022496149:AAG61Cw7GeQR65h03c3u61P9nTxsjshFK6Q'; 
const TELEGRAM_CHAT_ID = '6823869966'; 
// ==================================================

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("👮 ROBOT SECURITY ON! (Fitur: Transaksi + Auto Reply Chat)");
console.log("---------------------------------------");

// FUNGSI LAPOR KE ADMIN (SATU ARAH)
async function laporTelegram(pesan) {
    if(!TELEGRAM_TOKEN) return;
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: pesan,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.log("⚠️ Gagal lapor Telegram."); }
}

// ==================================================
// TUGAS 1: CEK TRANSAKSI & TEMBAK DIGIFLAZZ
// ==================================================
let lagiProsesDigi = false;

setInterval(async () => {
    if (lagiProsesDigi) return;
    lagiProsesDigi = true;

    try {
        const { data: listTrx, error } = await db
            .from('transactions')
            .select(`*, products (sku_provider, name)`)
            .eq('status', 'PROSES') 
            .is('sn', null) 
            .limit(1); 

        if (error) throw error;

        if (listTrx && listTrx.length > 0) {
            await prosesDigiflazz(listTrx[0]);
        }
    } catch (err) {
        console.log("⚠️ Error DB:", err.message);
    } finally {
        lagiProsesDigi = false;
    }
}, 3000); // Cek tiap 3 detik

async function prosesDigiflazz(trx) {
    const refId = trx.id;
    const sku = trx.products.sku_provider;

    if (!sku || sku.includes('pre2968')) {
        console.log(`⛔ SKU SALAH (${sku})`);
        return; 
    }

    console.log(`🚀 Memproses: ${trx.products.name} -> ID: ${trx.user_game_id}`);
    const sign = md5(USERNAME_DIGI + KEY_DIGI + refId);

    try {
        const res = await axios.post('https://api.digiflazz.com/v1/transaction', {
            username: USERNAME_DIGI,
            buyer_sku_code: sku,
            customer_no: trx.user_game_id,
            ref_id: refId,
            sign: sign,
            testing: false 
        });

        const hasil = res.data.data;
        console.log(`📡 Respon: ${hasil.message}`);
        
        if (hasil.rc === '00' || hasil.rc === '44' || hasil.status === 'Pending' || hasil.status === 'Sukses') {
            console.log("✅ SUKSES!");
            await db.from('transactions').update({ status: 'SUCCESS', sn: hasil.sn || refId }).eq('id', refId);
            // 🔥 TAMBAHAN LOGIKA GACHA: Robot Otomatis Bagi Poin 2% 🔥
            try {
                const dptPoint = Math.floor(trx.amount * 0.02);
                const { data: userPt } = await db.from('user_points').select('*').eq('phone', trx.user_phone).single();
                
                if (userPt) {
                    await db.from('user_points').update({points: userPt.points + dptPoint}).eq('phone', trx.user_phone);
                } else {
                    await db.from('user_points').insert([{phone: trx.user_phone, points: dptPoint}]);
                }
                console.log(`🎁 Poin Gacha ${dptPoint} berhasil dikirim ke ${trx.user_phone}`);
            } catch (errPoint) {
                console.log("⚠️ Gagal ngasih poin gacha:", errPoint.message);
            }
            
            laporTelegram(`✅ **TRANSAKSI SUKSES!**\n📦 ${trx.products.name}\n👤 ${trx.user_game_id}\nSN: \`${hasil.sn}\``);
        } else {
            console.log("❌ GAGAL.");
            await db.from('transactions').update({ status: 'FAILED', sn: hasil.message }).eq('id', refId);
             laporTelegram(`❌ **GAGAL!**\n📦 ${trx.products.name}\n⚠️ ${hasil.message}`);
        }

    } catch (err) {
        console.log("⚠️ ERROR API:", err.message);
        const errMsg = err.response?.data?.data?.message || "Error Koneksi";
        await db.from('transactions').update({ status: 'FAILED', sn: errMsg }).eq('id', refId);
        laporTelegram(`⚠️ **ERROR SYSTEM**\n${errMsg}`);
    }
}
let lastUpdateId = 0;
let lagiCekChat = false;

setInterval(async () => {
    if (lagiCekChat) return;
    lagiCekChat = true;

    try {
        const res = await axios.get(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${lastUpdateId + 1}`);
        const updates = res.data.result;

        if (updates.length > 0) {
            for (let item of updates) {
                lastUpdateId = item.update_id;
                
                if (item.message && item.message.text) {
                    const chatId = item.message.chat.id;
                    const text = item.message.text.toLowerCase();
                    const namaUser = item.message.from.first_name;

                    let balasan = "";

                    if (text === '/start' || text === 'halo' || text === 'hallo' || text === 'min') {
                        balasan = `Halo ${namaUser}! 👋\nSelamat datang di **YO GAMING BOT**.\n\nKetik perintah ini:\n👉 /link - Cek Link Website Terbaru\n👉 /help - Bantuan Admin`;
                    } 
                    else if (text.includes('link') || text.includes('web')) {
                        balasan = `🔗 **LINK AKTIF YO GAMING:**\n\n👉 https://curhat.yudhiyo.my.id\n\n_Klik link di atas untuk Top Up murah!_`;
                    }
                    else if (text.includes('help') || text.includes('bantuan') || text.includes('tanya')) {
                        balasan = `👨‍💻 **KONTAK ADMIN**\nSilakan chat WhatsApp admin jika ada kendala:\nwa.me/6289601629838`;
                    }
                    else {
                        balasan = `Maaf bos, saya robot. Ketik /link untuk belanja atau /help untuk bantuan.`;
                    }

                    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                        chat_id: chatId,
                        text: balasan,
                        parse_mode: 'Markdown'
                    });
                }
            }
        }
   } catch (err) {
    console.log("⚠️ Error Telegram Polling:", err.message || err);
   } finally {
        lagiCekChat = false;
    }
}, 3000); // Cek chat tiap 3 detik
