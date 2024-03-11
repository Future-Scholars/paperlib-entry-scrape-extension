import { PLAPI } from "paperlib-api/api";
import { PaperEntity } from "paperlib-api/model";
import { chunkRun } from "paperlib-api/utils";

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
]);

const ADDITIONAL_SCRAPER_OBJS = new Map<string, typeof AbstractEntryScraper>([
  ["webcontent-pdfurl", WebcontentPDFURLEntryScraper],
  ["webcontent-embed", WebcontentEmbedEntryScraper],
]);

interface IEntryPayload {
  type: string;
  value: any;
}

/**
 * EntryScrapeService transforms a data source, such as a local file, web page, etc., into a PaperEntity.*/
export class EntryScrapeService {
  constructor() {}

  async scrape(payloads: IEntryPayload[]): Promise<PaperEntity[]> {
      PLAPI.logService.info(
        `Transform entry payloads...`,
        JSON.stringify(payloads).substring(0, 100),
        false,
        "EntryScrapeExt",
      )

    const paperEntityDraftsAndErrors = await chunkRun<
      IEntryPayload,
      PaperEntity[],
      PaperEntity[]
    >(payloads, async (payload) => {
      const paperEntityDrafts: PaperEntity[] = [];
      for (const [key, Scraper] of SCRAPER_OBJS.entries()) {
        try {
          const objects = await Scraper.scrape(payload);
          paperEntityDrafts.push(...objects);
        } catch (error) {
          PLAPI.logService.error(
            `Failed to scrape entry payload by ${key}.`,
            error as Error,
            true,
            "EntryScrapeExt",
          );
        }
      }

      if (paperEntityDrafts.length === 0) {
        for (const [key, Scraper] of ADDITIONAL_SCRAPER_OBJS.entries()) {
          try {
            const objects = await Scraper.scrape(payload);
            paperEntityDrafts.push(...objects);
          } catch (error) {
            PLAPI.logService.error(
              `Failed to scrape entry payload by ${key}.`,
              error as Error,
              true,
              "EntryScrapeExt",
            );
          }
        }
      }

      return paperEntityDrafts;
    });
    const paperEntityDrafts = paperEntityDraftsAndErrors.results.flat();

    PLAPI.logService.info(
      `Transformed entry payloads.`,
      `${paperEntityDrafts.length} paper entities.`,
      false,
      "EntryScrapeExt",
    );


    return paperEntityDrafts;
  }
}
