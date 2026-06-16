const axios = require('axios');

// Token rahasia dari Telegram
const token = '8022496149:AAG61Cw7GeQR65h03c3u61P9nTxsjshFK6Q';

console.log("Bot (Versi Axios) sudah menyala dan siap bekerja bosku! 🚀");

let lastUpdateId = 0;

// Mesin polling jalan terus setiap 2 detik
setInterval(async () => {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}`);
        const updates = res.data.result;

        if (updates.length > 0) {
            for (let item of updates) {
                lastUpdateId = item.update_id;

                if (item.message && item.message.text) {
                    const chatId = item.message.chat.id;
                    const teksMasuk = item.message.text.toLowerCase();

                    let balasan = "";

                    // Logika If-Else
                    if (teksMasuk === 'halo') {
                        balasan = 'Halo juga! Ada yang bisa bot bantu?';
                    } 
                    else if (teksMasuk === 'info') {
                        balasan = 'Saya adalah bot otomatis yang hidup di dalam Termux lho!';
                    } 
                    else {
                        balasan = `Maaf, bot belum paham maksud dari: "${item.message.text}"`;
                    }

                    // Tembak balasan ke user
                    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                        chat_id: chatId,
                        text: balasan
                    });
                }
            }
        }
    } catch (err) {
        console.log("⚠️ Error Cek Pesan:", err.message);
    }
}, 2000); 
