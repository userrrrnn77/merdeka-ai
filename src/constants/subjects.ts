// Mirror dengan frontend/src/constants/subjects.ts — jaga konsisten kalau diubah.

export const JENJANG = {
  SMP: "smp",
  SMA: "sma",
  KULIAH: "kuliah",
} as const;

export type Jenjang = (typeof JENJANG)[keyof typeof JENJANG];

export const SUBJECTS = {
  MATEMATIKA: "matematika",
  FISIKA: "fisika",
  KIMIA: "kimia",
  BIOLOGI: "biologi",
  EKONOMI: "ekonomi",
  SOSIOLOGI: "sosiologi",
  GEOGRAFI: "geografi",
  SEJARAH: "sejarah",
  BAHASA_INDONESIA: "bahasa_indonesia",
  BAHASA_INGGRIS: "bahasa_inggris",
  AKUNTANSI: "akuntansi",
  MANAJEMEN: "manajemen",
  PROGRAMMING: "programming",
  UTBK_SNBT: "utbk_snbt",
  UMUM: "umum",
} as const;

export type Subject = (typeof SUBJECTS)[keyof typeof SUBJECTS];

export const JENJANG_LABELS: Record<Jenjang, string> = {
  [JENJANG.SMP]: "SMP",
  [JENJANG.SMA]: "SMA",
  [JENJANG.KULIAH]: "Kuliah",
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  [SUBJECTS.MATEMATIKA]: "Matematika",
  [SUBJECTS.FISIKA]: "Fisika",
  [SUBJECTS.KIMIA]: "Kimia",
  [SUBJECTS.BIOLOGI]: "Biologi",
  [SUBJECTS.EKONOMI]: "Ekonomi",
  [SUBJECTS.SOSIOLOGI]: "Sosiologi",
  [SUBJECTS.GEOGRAFI]: "Geografi",
  [SUBJECTS.SEJARAH]: "Sejarah",
  [SUBJECTS.BAHASA_INDONESIA]: "Bahasa Indonesia",
  [SUBJECTS.BAHASA_INGGRIS]: "Bahasa Inggris",
  [SUBJECTS.AKUNTANSI]: "Akuntansi",
  [SUBJECTS.MANAJEMEN]: "Manajemen",
  [SUBJECTS.PROGRAMMING]: "Pemrograman",
  [SUBJECTS.UTBK_SNBT]: "UTBK/SNBT",
  [SUBJECTS.UMUM]: "Umum",
};
