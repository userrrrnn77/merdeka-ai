// src/modules/knowledge/seeder/original.seed.ts
// Section 7 planning — Tier 1 seed content: soal & materi buatan sendiri,
// 100% clean secara legal. Ini knowledge base awal sebelum Tier 2/3 masuk.

import type { KnowledgeSourceInput } from "../../../types/knowledge.types.js";

export const ORIGINAL_SEED_CONTENT: KnowledgeSourceInput[] = [
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Hukum Newton — Gerak dan Gaya",
    slug: "hukum-newton-gerak-gaya",
    subjectTags: ["fisika", "sma", "smp"],
    fullText: `
Hukum Newton adalah tiga hukum fisika yang menjadi dasar mekanika klasik.

Hukum Newton I (Hukum Inersia)
Sebuah benda akan tetap diam atau bergerak lurus beraturan selama tidak ada gaya luar yang bekerja padanya.
Contoh: buku di atas meja tetap diam selama tidak ada yang mendorongnya.

Hukum Newton II (F = ma)
Percepatan suatu benda berbanding lurus dengan gaya yang bekerja padanya dan berbanding terbalik dengan massanya.
Rumus: F = m × a
Di mana: F = gaya (Newton), m = massa (kg), a = percepatan (m/s²)

Contoh soal:
Sebuah benda bermassa 5 kg didorong dengan gaya 20 N. Berapa percepatannya?
Jawab: a = F/m = 20/5 = 4 m/s²

Hukum Newton III (Aksi-Reaksi)
Setiap aksi menghasilkan reaksi yang sama besar namun berlawanan arah.
Contoh: saat kamu mendorong tembok, tembok mendorong balik dengan gaya yang sama.

Penerapan Hukum Newton dalam kehidupan sehari-hari:
- Sabuk pengaman di mobil (Newton I)
- Roket yang meluncur (Newton III)
- Mendorong gerobak belanja (Newton II)
    `.trim(),
  },
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Persamaan Kuadrat — Konsep dan Penyelesaian",
    slug: "persamaan-kuadrat-konsep-penyelesaian",
    subjectTags: ["matematika", "sma", "smp"],
    fullText: `
Persamaan kuadrat adalah persamaan polinomial berderajat dua dengan bentuk umum:
ax² + bx + c = 0, di mana a ≠ 0

Metode Penyelesaian Persamaan Kuadrat

1. Faktorisasi
Contoh: x² + 5x + 6 = 0
Cari dua bilangan yang hasil kali = 6 dan jumlah = 5 → 2 dan 3
Faktorisasi: (x + 2)(x + 3) = 0
Solusi: x = -2 atau x = -3

2. Rumus Kuadrat (Rumus ABC)
x = (-b ± √(b² - 4ac)) / 2a

Contoh: 2x² - 5x + 3 = 0
a = 2, b = -5, c = 3
Diskriminan: D = b² - 4ac = 25 - 24 = 1
x = (5 ± √1) / 4
x₁ = (5 + 1)/4 = 3/2
x₂ = (5 - 1)/4 = 1

3. Melengkapi Kuadrat
Digunakan saat faktorisasi sulit ditemukan.

Diskriminan dan Jenis Akar:
- D > 0: dua akar real berbeda
- D = 0: dua akar real sama (kembar)
- D < 0: tidak ada akar real (akar imajiner)
    `.trim(),
  },
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Permintaan dan Penawaran — Ekonomi Mikro",
    slug: "permintaan-penawaran-ekonomi-mikro",
    subjectTags: ["ekonomi", "sma", "kuliah"],
    fullText: `
Permintaan dan Penawaran adalah konsep dasar ekonomi mikro yang menjelaskan bagaimana harga terbentuk di pasar.

Hukum Permintaan
Semakin tinggi harga suatu barang, semakin sedikit jumlah yang diminta (ceteris paribus).
Kurva permintaan berslope negatif (turun dari kiri ke kanan).

Faktor yang mempengaruhi permintaan:
- Pendapatan konsumen
- Harga barang substitusi dan komplementer
- Selera dan preferensi
- Ekspektasi harga di masa depan
- Jumlah pembeli

Hukum Penawaran
Semakin tinggi harga suatu barang, semakin banyak jumlah yang ditawarkan (ceteris paribus).
Kurva penawaran berslope positif (naik dari kiri ke kanan).

Faktor yang mempengaruhi penawaran:
- Biaya produksi
- Teknologi
- Harga input (bahan baku, tenaga kerja)
- Jumlah produsen
- Kebijakan pemerintah (pajak, subsidi)

Keseimbangan Pasar (Ekuilibrium)
Terjadi saat jumlah yang diminta = jumlah yang ditawarkan.
Di titik ini terbentuk harga keseimbangan (P*) dan kuantitas keseimbangan (Q*).

Contoh: Jika harga bensin naik, permintaan ojek online bisa turun
(karena biaya operasional driver naik → tarif naik → konsumen beralih ke moda lain).
    `.trim(),
  },
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Ikatan Kimia — Kovalen dan Ionik",
    slug: "ikatan-kimia-kovalen-ionik",
    subjectTags: ["kimia", "sma"],
    fullText: `
Ikatan kimia adalah gaya yang menyatukan atom-atom dalam suatu senyawa.

Ikatan Ion
Terbentuk antara atom yang melepas elektron (logam) dan atom yang menerima elektron (non-logam).
Contoh: NaCl (garam dapur)
- Na melepas 1 elektron → Na⁺
- Cl menerima 1 elektron → Cl⁻
- Gaya tarik menarik antara Na⁺ dan Cl⁻ membentuk ikatan ion

Sifat senyawa ionik:
- Titik leleh dan didih tinggi
- Larut dalam air dan menghantarkan listrik saat larut
- Berbentuk kristal padat pada suhu ruang

Ikatan Kovalen
Terbentuk saat dua atom berbagi pasangan elektron.
Contoh: H₂O (air)
- O membutuhkan 2 elektron, masing-masing H menyumbang 1 elektron
- Terbentuk 2 pasangan elektron bersama

Jenis ikatan kovalen:
- Kovalen tunggal: 1 pasang elektron bersama (H-H)
- Kovalen rangkap dua: 2 pasang elektron bersama (O=O)
- Kovalen rangkap tiga: 3 pasang elektron bersama (N≡N)

Perbedaan kovalen polar vs nonpolar:
- Polar: perbedaan keelektronegatifan besar (HCl, H₂O)
- Nonpolar: keelektronegatifan sama atau simetris (H₂, CO₂)
    `.trim(),
  },
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Trigonometri — Sin, Cos, Tan dan Identitas Dasar",
    slug: "trigonometri-sin-cos-tan-identitas",
    subjectTags: ["matematika", "sma"],
    fullText: `
Trigonometri mempelajari hubungan antara sudut dan sisi-sisi segitiga.

Definisi Dasar (Segitiga Siku-siku)
sin θ = sisi depan / sisi miring
cos θ = sisi samping / sisi miring
tan θ = sisi depan / sisi samping = sin θ / cos θ

Cara ingat: SOH-CAH-TOA
- Sin = Opposite / Hypotenuse
- Cos = Adjacent / Hypotenuse
- Tan = Opposite / Adjacent

Nilai Trigonometri Sudut Istimewa:
Sudut | sin   | cos   | tan
0°    | 0     | 1     | 0
30°   | 1/2   | ½√3  | ⅓√3
45°   | ½√2  | ½√2  | 1
60°   | ½√3  | 1/2   | √3
90°   | 1     | 0     | ∞

Identitas Trigonometri Dasar:
sin²θ + cos²θ = 1
tan θ = sin θ / cos θ
1 + tan²θ = sec²θ
1 + cot²θ = csc²θ

Contoh soal:
Jika sin θ = 3/5, tentukan cos θ dan tan θ (θ di kuadran I)
Jawab:
cos²θ = 1 - sin²θ = 1 - 9/25 = 16/25
cos θ = 4/5
tan θ = sin θ / cos θ = (3/5)/(4/5) = 3/4
    `.trim(),
  },
  {
    source: "original",
    sourceTier: 1,
    license: "original",
    sourceWeight: 1.0,
    lang: "id",
    title: "Dasar Pemrograman — Variabel, Loop, dan Fungsi",
    slug: "dasar-pemrograman-variabel-loop-fungsi",
    subjectTags: ["programming", "sma", "kuliah"],
    fullText: `
Pemrograman adalah proses memberikan instruksi kepada komputer untuk menyelesaikan tugas.

Variabel
Wadah untuk menyimpan data. Seperti kotak berlabel yang bisa menyimpan nilai.
Contoh (Python):
nama = "Budi"
umur = 17
nilai = 85.5

Tipe data dasar:
- Integer (int): bilangan bulat → 1, 2, 100
- Float: bilangan desimal → 3.14, 2.5
- String (str): teks → "halo", "nama"
- Boolean: True atau False

Kondisional (If-Else)
Membuat keputusan berdasarkan kondisi tertentu.
nilai = 75
if nilai >= 75:
    print("Lulus")
elif nilai >= 60:
    print("Remidi")
else:
    print("Tidak lulus")

Loop (Perulangan)
Menjalankan kode berulang tanpa menulis ulang.

For loop — iterasi sejumlah tertentu:
for i in range(5):
    print(i)  # cetak 0, 1, 2, 3, 4

While loop — iterasi selama kondisi benar:
hitung = 0
while hitung < 5:
    print(hitung)
    hitung += 1

Fungsi
Blok kode yang bisa dipanggil berulang kali.
def hitung_luas_persegi(sisi):
    luas = sisi * sisi
    return luas

hasil = hitung_luas_persegi(5)
print(hasil)  # output: 25

Analogi: fungsi seperti resep masakan — tulis sekali, bisa dipakai berkali-kali
tanpa menulis ulang langkah-langkahnya.
    `.trim(),
  },
];
