// src/modules/knowledge/crawler/wikipedia.crawler.ts
// Section 7 planning: Wikipedia via API resmi, no auth, JSON bersih,
// delay 1-2 detik antar request + proper User-Agent agar tidak kena
// rate limit. Tier 3 (fallback, bobot retrieval 0.5 — lihat
// constants RAG weighting di rag.service.ts / planning Section 7).

import axios from "axios";
import { cleanCrawledText } from "../../../utils/textCleaner.js";
import type { KnowledgeSourceInput } from "../../../types/knowledge.types.js";
import { logger } from "../../../utils/logger.js";

const WIKIPEDIA_API_BASE = "https://id.wikipedia.org/w/api.php";
const USER_AGENT =
  "AIEduBot/1.0 (contoh@email.com) - educational RAG content fetcher";
const CRAWL_DELAY_MS = 1500;

interface WikipediaPageResult {
  title: string;
  extract: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWikipediaExtract(
  title: string,
): Promise<WikipediaPageResult | null> {
  try {
    const response = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: "query",
        prop: "extracts",
        explaintext: true,
        titles: title,
        format: "json",
        redirects: 1,
      },
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });

    const pages = response.data?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as {
      title?: string;
      extract?: string;
      missing?: string;
    };

    if (page.missing !== undefined || !page.extract) {
      logger.warn(`[WikipediaCrawler] Halaman "${title}" tidak ditemukan`);
      return null;
    }

    return { title: page.title ?? title, extract: page.extract };
  } catch (error) {
    logger.error(
      `[WikipediaCrawler] Gagal fetch "${title}": ${(error as Error).message}`,
    );
    return null;
  }
}

/**
 * Crawl satu atau lebih judul Wikipedia, dengan delay antar request
 * untuk menghindari rate limit (sesuai planning).
 */
export async function crawlWikipediaTitles(
  titles: string[],
  subjectTags: string[],
): Promise<KnowledgeSourceInput[]> {
  const results: KnowledgeSourceInput[] = [];

  for (const title of titles) {
    const page = await fetchWikipediaExtract(title);

    if (page) {
      results.push({
        source: "wikipedia",
        sourceTier: 3,
        license: "cc-by-sa",
        sourceWeight: 0.5, // Tier 3 — fallback, bukan fondasi (Section 7)
        lang: "id",
        title: page.title,
        slug: `wikipedia-${slugify(page.title)}`,
        fullText: cleanCrawledText(page.extract),
        subjectTags,
      });
    }

    await wait(CRAWL_DELAY_MS);
  }

  return results;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
