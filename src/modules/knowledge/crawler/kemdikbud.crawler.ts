// src/modules/knowledge/crawler/pdf.crawler.ts
// FIX: pdf-parse adalah CJS module. Di ESM/NodeNext environment (Bun + TS),
// import default dari CJS bisa undefined. Pakai createRequire sebagai workaround
// yang konsisten tanpa perlu @types/pdf-parse atau dynamic import trick.

import { createRequire } from "module";
import * as fs from "fs";
import { cleanCrawledText } from "../../../utils/textCleaner.js";
import { logger } from "../../../utils/logger.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
  options?: object,
) => Promise<{ text: string; numpages: number; info: Record<string, unknown> }>;

export interface PDFParseResult {
  text: string;
  pageCount: number;
  title?: string;
}

export async function parsePDFFromPath(
  filePath: string,
): Promise<PDFParseResult> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File tidak ditemukan: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);

  try {
    const result = await pdfParse(buffer);
    const cleanedText = cleanCrawledText(result.text);

    logger.info(
      `[PDFCrawler] Berhasil parse "${filePath}" — ${result.numpages} halaman, ${cleanedText.length} karakter`,
    );

    return {
      text: cleanedText,
      pageCount: result.numpages,
      title: (result.info?.Title as string) || undefined,
    };
  } catch (error) {
    logger.error(
      `[PDFCrawler] Gagal parse PDF "${filePath}": ${(error as Error).message}`,
    );
    throw error;
  }
}

export async function parsePDFFromBuffer(
  buffer: Buffer,
): Promise<PDFParseResult> {
  try {
    const result = await pdfParse(buffer);
    const cleanedText = cleanCrawledText(result.text);

    return {
      text: cleanedText,
      pageCount: result.numpages,
      title: (result.info?.Title as string) || undefined,
    };
  } catch (error) {
    logger.error(
      `[PDFCrawler] Gagal parse PDF dari buffer: ${(error as Error).message}`,
    );
    throw error;
  }
}
