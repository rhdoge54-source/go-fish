# NPC Penjaga di Semua Toko

Fokus tahap ini: hanya menambah karakter NPC bergaya Roblox di tiap toko. Sistem jual-beli dibangun setelahnya, satu per satu.

## Yang akan dibuat

Empat NPC berdiri di depan tokonya masing-masing:

| NPC | Toko | Posisi bangunan |
| --- | --- | --- |
| Pedagang Ikan (sudah ada, dirapikan) | FISHSHOP | 10.1, 3.8 |
| Penjual Umpan | Bait Shop | -14.6, -3.4 |
| Penjual Joran | Rod Shop | -42.9, -11.3 |
| Penjual Kapal | Boat Shop | 30.6, 22.7 |

Setiap NPC:
- Tubuh kotak khas Roblox (R6) memakai gaya yang sama seperti pedagang ikan sekarang.
- Wajah berbeda: pedagang ikan tersenyum lebar, penjual umpan mata menyipit ceria, penjual joran serius/berkumis, penjual kapal wajah nyengir dengan mata satu tertutup (bajak laut).
- Pakaian berbeda: warna kulit, kaos, celana, celemek/rompi/jaket, dan penutup kepala (topi jerami, topi rajut, topi bertepi lebar, topi kapten) berbeda per NPC.
- Berdiri di atas tanah dengan otomatis menyesuaikan tinggi permukaan, gerakan bernapas halus, dan menoleh ke pemain saat didekati.
- Gelembung "Press E to talk" muncul saat pemain dekat.

## Interaksi tahap ini

Tekan E membuka panel percakapan sederhana milik NPC tersebut: sapaan khas dan beberapa baris obrolan, plus catatan "Toko segera dibuka". Pedagang ikan tetap bisa menjual ikan seperti sekarang.

Panel dibuat satu komponen yang bisa dipakai ulang, sehingga saat sistemnya dibangun nanti (toko kapal, umpan, joran) isinya cukup ditambahkan tanpa membongkar ulang.

## Catatan teknis

- `Merchant.tsx` dipecah menjadi `NpcCharacter.tsx` (badan blocky + wajah dari canvas texture, semua warna & ekspresi lewat props) dan definisi NPC di `npcs.ts` (id, nama, posisi, jarak bicara, palet pakaian, jenis topi, ekspresi, dialog).
- `useMerchant` diperluas jadi store NPC: menyimpan `nearId` dan `openId`, satu handler tombol E untuk semua NPC. Kode pedagang ikan tetap jalan.
- `MerchantDialog` dijadikan panel generik `NpcDialog` yang membaca `openId`; tab jual ikan hanya untuk pedagang ikan.
- Tidak ada perubahan database di tahap ini.

## Setelah ini (urutan pembangunan sistem)

1. Toko joran & umpan (peningkatan alat, koin akhirnya berguna)
2. Toko kapal
3. Misi harian & pencapaian
4. Papan peringkat
5. Buku koleksi ikan
6. Perlawanan ikan monster
