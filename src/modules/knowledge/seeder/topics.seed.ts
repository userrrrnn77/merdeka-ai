// src/modules/knowledge/seeder/topics.seed.ts
// Section 1 & 7 planning: daftar topik kurikulum sebagai acuan saat
// menulis seed soal & materi mandiri (Tier 1 RAG). List ini sengaja
// tidak lengkap untuk semua mapel di awal — fokus ke mapel utama dulu
// (eksakta + UTBK) sesuai prioritas MVP, tambah bertahap berdasarkan
// rag_miss rate dari usage_logs nantinya.

import {
  SUBJECTS,
  JENJANG,
  type Subject,
  type Jenjang,
} from "../../../constants/subjects.js";

export interface TopicSeed {
  subject: Subject;
  jenjang: Jenjang;
  topic: string; // slug, dipakai juga di userLearningLog.topic
  label: string;
}

export const TOPIC_SEED_LIST: TopicSeed[] = [
  // Matematika SMA
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "fungsi-kuadrat",
    label: "Fungsi Kuadrat",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "trigonometri",
    label: "Trigonometri",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "barisan-deret",
    label: "Barisan dan Deret",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "limit-fungsi",
    label: "Limit Fungsi",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "turunan",
    label: "Turunan (Derivatif)",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "integral",
    label: "Integral",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "peluang",
    label: "Peluang",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMA,
    topic: "matriks",
    label: "Matriks",
  },

  // Matematika SMP
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMP,
    topic: "persamaan-linear",
    label: "Persamaan Linear Satu Variabel",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMP,
    topic: "bangun-ruang",
    label: "Bangun Ruang",
  },
  {
    subject: SUBJECTS.MATEMATIKA,
    jenjang: JENJANG.SMP,
    topic: "pythagoras",
    label: "Teorema Pythagoras",
  },

  // Fisika SMA
  {
    subject: SUBJECTS.FISIKA,
    jenjang: JENJANG.SMA,
    topic: "hukum-newton",
    label: "Hukum Newton",
  },
  {
    subject: SUBJECTS.FISIKA,
    jenjang: JENJANG.SMA,
    topic: "gerak-lurus",
    label: "Gerak Lurus",
  },
  {
    subject: SUBJECTS.FISIKA,
    jenjang: JENJANG.SMA,
    topic: "usaha-energi",
    label: "Usaha dan Energi",
  },
  {
    subject: SUBJECTS.FISIKA,
    jenjang: JENJANG.SMA,
    topic: "termodinamika",
    label: "Termodinamika",
  },
  {
    subject: SUBJECTS.FISIKA,
    jenjang: JENJANG.SMA,
    topic: "listrik-statis",
    label: "Listrik Statis",
  },

  // Kimia SMA
  {
    subject: SUBJECTS.KIMIA,
    jenjang: JENJANG.SMA,
    topic: "stoikiometri",
    label: "Stoikiometri",
  },
  {
    subject: SUBJECTS.KIMIA,
    jenjang: JENJANG.SMA,
    topic: "ikatan-kimia",
    label: "Ikatan Kimia",
  },
  {
    subject: SUBJECTS.KIMIA,
    jenjang: JENJANG.SMA,
    topic: "laju-reaksi",
    label: "Laju Reaksi",
  },
  {
    subject: SUBJECTS.KIMIA,
    jenjang: JENJANG.SMA,
    topic: "asam-basa",
    label: "Asam dan Basa",
  },

  // Biologi SMA
  {
    subject: SUBJECTS.BIOLOGI,
    jenjang: JENJANG.SMA,
    topic: "sel",
    label: "Struktur dan Fungsi Sel",
  },
  {
    subject: SUBJECTS.BIOLOGI,
    jenjang: JENJANG.SMA,
    topic: "genetika",
    label: "Genetika",
  },
  {
    subject: SUBJECTS.BIOLOGI,
    jenjang: JENJANG.SMA,
    topic: "sistem-pencernaan",
    label: "Sistem Pencernaan",
  },

  // Ekonomi SMA
  {
    subject: SUBJECTS.EKONOMI,
    jenjang: JENJANG.SMA,
    topic: "permintaan-penawaran",
    label: "Permintaan dan Penawaran",
  },
  {
    subject: SUBJECTS.EKONOMI,
    jenjang: JENJANG.SMA,
    topic: "inflasi",
    label: "Inflasi",
  },

  // Programming (kuliah)
  {
    subject: SUBJECTS.PROGRAMMING,
    jenjang: JENJANG.KULIAH,
    topic: "struktur-data-queue-stack",
    label: "Struktur Data: Queue & Stack",
  },
  {
    subject: SUBJECTS.PROGRAMMING,
    jenjang: JENJANG.KULIAH,
    topic: "algoritma-sorting",
    label: "Algoritma Sorting",
  },
  {
    subject: SUBJECTS.PROGRAMMING,
    jenjang: JENJANG.KULIAH,
    topic: "basis-data-relasional",
    label: "Basis Data Relasional",
  },

  // UTBK/SNBT
  {
    subject: SUBJECTS.UTBK_SNBT,
    jenjang: JENJANG.SMA,
    topic: "penalaran-umum",
    label: "Penalaran Umum",
  },
  {
    subject: SUBJECTS.UTBK_SNBT,
    jenjang: JENJANG.SMA,
    topic: "literasi-bahasa-indonesia",
    label: "Literasi dalam Bahasa Indonesia",
  },
  {
    subject: SUBJECTS.UTBK_SNBT,
    jenjang: JENJANG.SMA,
    topic: "pengetahuan-kuantitatif",
    label: "Pengetahuan Kuantitatif",
  },
];

export function getTopicsBySubject(subject: Subject): TopicSeed[] {
  return TOPIC_SEED_LIST.filter((t) => t.subject === subject);
}

export function getTopicsByJenjang(jenjang: Jenjang): TopicSeed[] {
  return TOPIC_SEED_LIST.filter((t) => t.jenjang === jenjang);
}
