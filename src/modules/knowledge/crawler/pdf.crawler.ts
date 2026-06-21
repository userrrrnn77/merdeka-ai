// src/modules/knowledge/crawler/pdf.crawler.ts
// FIX: pdf-parse ESM export gak punya `.default` — package ini CommonJS-first.
// Pakai `import * as pdfParseModule` + conditional fallback untuk handle
// perbedaan CJS/ESM interop di Bun/Node.

import { readFile } from "fs/promises";
import { chunkText } from "../../../utils/chunker.js";
import { cleanCrawledText } from "../../../utils/textCleaner.js";
import { logger } from "../../../utils/logger.js";

// FIX: pakai dynamic import dengan fallback untuk handle CJS interop
async function getPdfParser() {
  const mod = await import("pdf-parse");
  // CJS interop: module bisa ada di .default atau langsung di mod
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = (mod as any).default ?? mod;
  if (typeof parser !== "function") {
    throw new Error("pdf-parse tidak bisa di-load sebagai function");
  }
  return parser as (
    buffer: Buffer,
  ) => Promise<{ text: string; numpages: number }>;
}

export interface ParsedPDF {
  title: string;
  fullText: string;
  chunks: Array<{ chunkId: number; text: string }>;
  pageCount: number;
}

/**
 * Parse PDF dari file path lokal.
 * Dipakai untuk buku sekolah open-source yang di-download manual
 * (Section 7 planning — Tier 2, bukan live scraping).
 */
export async function parsePDFFromPath(
  filePath: string,
  title: string,
): Promise<ParsedPDF> {
  logger.info(`[PDFCrawler] Parsing PDF: ${filePath}`);

  const buffer = await readFile(filePath);
  const pdfParse = await getPdfParser();
  const data = await pdfParse(buffer);

  const cleanedText = cleanCrawledText(data.text);
  const chunks = chunkText(cleanedText);

  logger.info(
    `[PDFCrawler] Selesai parse "${title}" — ${data.numpages} halaman, ${chunks.length} chunk`,
  );

  return {
    title,
    fullText: cleanedText,
    chunks,
    pageCount: data.numpages,
  };
}

/**
 * Parse PDF dari Buffer langsung (untuk future: upload user).
 */
export async function parsePDFFromBuffer(
  buffer: Buffer,
  title: string,
): Promise<ParsedPDF> {
  const pdfParse = await getPdfParser();
  const data = await pdfParse(buffer);

  const cleanedText = cleanCrawledText(data.text);
  const chunks = chunkText(cleanedText);

  return {
    title,
    fullText: cleanedText,
    chunks,
    pageCount: data.numpages,
  };
}
