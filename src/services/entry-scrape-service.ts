import { PaperEntity } from "paperlib-api";

import { BibTexEntryScraper } from "@/scrapers/bibtex-entry-scraper";
import { AbstractEntryScraper } from "@/scrapers/entry-scraper";
import { PaperEntityEntryScraper } from "@/scrapers/paperentity-entry-scraper";
import { PDFEntryScraper } from "@/scrapers/pdf-entry-scraper";
import { WebcontentArXivEntryScraper } from "@/scrapers/webcontent-arxiv-entry-scraper";
import { WebcontentCNKIEntryScraper } from "@/scrapers/webcontent-cnki-entry-scraper";
import { WebcontentEmbedEntryScraper } from "@/scrapers/webcontent-embed-entry-scraper";
import { WebcontentGoogleScholarEntryScraper } from "@/scrapers/webcontent-googlescholar-entry-scraper";
import { WebcontentIEEEEntryScraper } from "@/scrapers/webcontent-ieee-entry-scraper";
import { WebcontentPDFURLEntryScraper } from "@/scrapers/webcontent-pdfurl-entry-scraper";
import { ZoteroCSVEntryScraper } from "@/scrapers/zoterocsv-entry-scraper";

const SCRAPER_OBJS = new Map<string, typeof AbstractEntryScraper>([
  ["pdf", PDFEntryScraper],
  ["bibtex", BibTexEntryScraper],
  ["paperentity", PaperEntityEntryScraper],
  ["zoterocsv", ZoteroCSVEntryScraper],
  ["webcontent-arxiv", WebcontentArXivEntryScraper],
  ["webcontent-googlescholar", WebcontentGoogleScholarEntryScraper],
  ["webcontent-ieee", WebcontentIEEEEntryScraper],
  ["webcontent-cnki", WebcontentCNKIEntryScraper],
  ["webcontent-pdfurl", WebcontentPDFURLEntryScraper],
  ["webcontent-embed", WebcontentEmbedEntryScraper],
]);

/**
 * EntryScrapeService transforms a data source, such as a local file, web page, etc., into a PaperEntity.*/
export class EntryScrapeService {
  constructor() {}

  async scrape(payloads: any[]): Promise<PaperEntity[]> {
    // TODO: should check valid payload structure here.
    // TODO: Chunkrun?
    const paperEntityDrafts = await Promise.all(
      payloads.map(async (payload) => {
        const paperEntityDrafts = await Promise.all(
          Array.from(SCRAPER_OBJS.values()).map(async (Scraper) => {
            return await Scraper.scrape(payload);
          }),
        );
        return paperEntityDrafts.flat();
      }),
    );
    return paperEntityDrafts.flat();
  }
}
