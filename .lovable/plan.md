# Sistem Berikutnya untuk Koleo Island

Saat ini game sudah punya: dunia 3D + kapal, cuaca dinamis, memancing dengan ikan langka & mutasi, inventaris ikan, jual ikan ke pedagang, profil pemain (koin, XP, level) dengan login dompet, dan penyimpanan foto profil.

Yang belum ada dan paling terasa hilang, diurutkan dari yang paling berdampak:

## 1. Toko & Peningkatan Alat (prioritas tertinggi)
Koin sekarang hanya menumpuk tanpa gunanya. Tambahkan:
- Toko di pedagang untuk membeli joran (batas berat tangkapan lebih besar) dan umpan (peluang ikan langka naik).
- Kepemilikan alat tersimpan di profil, joran/umpan aktif dipakai saat memancing.
- Umpan habis pakai dengan jumlah stok.

## 2. Misi Harian & Pencapaian
- 3 misi harian yang berganti tiap hari (mis. "tangkap 5 ikan langka", "jual 20 kg"), hadiah koin + XP.
- Pencapaian permanen (ikan pertama, ikan mitos, level 10) dengan lencana di profil.

## 3. Papan Peringkat
- Peringkat global: total koin, level, dan tangkapan terberat.
- Ditampilkan sebagai panel yang bisa dibuka dari HUD.

## 4. Buku Koleksi Ikan (Fishdex)
- Daftar semua spesies; yang belum tertangkap tampil sebagai siluet.
- Rekam berat terbaik & mutasi yang pernah didapat per spesies.
- Bonus koin saat koleksi lengkap per tingkat kelangkaan.

## 5. Ikan Monster & Perlawanan Saat Memancing
Aset monster sudah ada tapi belum jadi tantangan nyata. Tambahkan mini-game tarik-ulur: garis bisa putus jika joran terlalu lemah, hadiah jauh lebih besar.

## 6. Ekonomi & Keseimbangan
- Harga pasar berfluktuasi harian per spesies.
- Kapasitas inventaris terbatas, ditingkatkan lewat toko.

## Catatan teknis
- Tabel baru: `shop_items`, `player_inventory` (alat/umpan), `quests`, `player_quests`, `achievements`, `player_achievements`, `species_records`. Semua di Lovable Cloud dengan RLS + GRANT.
- Semua perubahan koin/XP lewat fungsi database bertanda `security definer` seperti `record_catch` dan `sell_fish` agar tidak bisa dicurangi dari sisi klien.
- Papan peringkat memakai view baca-publik agar aman ditampilkan tanpa membocorkan data profil lain.
- UI baru memakai gaya panel HUD yang sudah ada.

Saya sarankan mulai dari sistem 1 dan 2 dulu karena keduanya langsung memberi tujuan bermain jangka panjang.
