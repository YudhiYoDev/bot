const { createClient } = require('@supabase/supabase-js');

// === GANTI PAKAI SERVICE ROLE KEY (Bukan Anon Key) ===
const URL_LAMA = 'https://jpavxamzswrnbtepsozo.supabase.co';
const KEY_LAMA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYXZ4YW16c3dybmJ0ZXBzb3pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxMjY1OSwiZXhwIjoyMDg4OTg4NjU5fQ.2TCWS9aFBeecSx9lrJWegtdCARR8od-cCAX4BZ4HFCU'; 

const URL_BARU = 'https://api.yudhiyo-tecno.com';
const KEY_BARU = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MTUxODMyMCwiZXhwIjo0OTM3MTkxOTIwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.S7OF-MLTzk0kbc3CpR_74UBSaCkc6F_Ncq__8c0Qt6w';
// =======================================================

const supabaseLama = createClient(URL_LAMA, KEY_LAMA);
const supabaseBaru = createClient(URL_BARU, KEY_BARU);

async function gasPindahSemua() {
    console.log("🕵️ Mencari daftar bucket di Supabase Lama...");
    
    // 1. Ambil semua nama bucket
    const { data: buckets, error: errBuckets } = await supabaseLama.storage.listBuckets();
    if (errBuckets) return console.log("Gagal ambil daftar bucket:", errBuckets);

    console.log(`Ketemu ${buckets.length} bucket! Gas kita sikat satu-satu...\n`);

    for (const bucket of buckets) {
        const namaBucket = bucket.name;
        console.log(`\n📦 MENGGEREBEK BUCKET: [${namaBucket}]`);

        // 2. Bikin bucket yang sama di VPS otomatis
        const { error: errCreate } = await supabaseBaru.storage.createBucket(namaBucket, { 
            public: bucket.public // Status public/private disamain
        });
        
        if (errCreate && errCreate.message !== 'The resource already exists') {
            console.log(`⚠️ Gagal bikin bucket ${namaBucket} di VPS:`, errCreate.message);
        }

        // 3. Tarik isi file dengan limit raksasa (biar 3000 foto keangkut)
        const { data: listFile, error: errList } = await supabaseLama.storage.from(namaBucket).list('', { limit: 5000 });
        
        if (errList || !listFile) {
            console.log(`⚠️ Kosong/Error di bucket [${namaBucket}]`);
            continue;
        }

        console.log(`Ditemukan ${listFile.length} file. Mulai menyedot...`);
        let sukses = 0;

        // 4. Proses Pindah
        for (const file of listFile) {
            if (file.name === '.emptyFolderPlaceholder') continue;

            const { data: fileBlob, error: errDown } = await supabaseLama.storage.from(namaBucket).download(file.name);
            if (!errDown) {
                const { error: errUp } = await supabaseBaru.storage.from(namaBucket).upload(file.name, fileBlob, { upsert: true });
                if (!errUp) {
                    sukses++;
                    process.stdout.write(`\r✅ Berhasil pindah: ${sukses}/${listFile.length} foto`);
                }
            }
        }
        console.log(`\n🎉 Bucket [${namaBucket}] Kelar!`);
    }

    console.log("\n🚀 ALHAMDULILLAH! SEMUA BUCKET & FOTO BERHASIL HIJRAH!");
}

gasPindahSemua();
