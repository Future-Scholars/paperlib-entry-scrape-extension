import { PLAPI, PLExtAPI, PLExtension } from "paperlib-api/api";

import { EntryScrapeService } from "@/services/entry-scrape-service";

class PaperlibEntryScrapeExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  private readonly _entryScrapeService: EntryScrapeService;

  constructor() {
    super({
      id: "@future-scholars/paperlib-entry-scrape-extension",
      defaultPreference: {
        "local-pdf-parse": {
          type: "boolean",
          name: "Parse PDF locally",
          description: "Use local function to parse PDFs (fast) or the online API (accurate)",
          value: true,
          order: 1,
        }
      },
    });

    this._entryScrapeService = new EntryScrapeService();

    this.disposeCallbacks = [];
  }

  async initialize() {
    await PLExtAPI.extensionPreferenceService.register(
      this.id,
      this.defaultPreference,
    );

    this.disposeCallbacks.push(
      PLAPI.hookService.hookTransform("scrapeEntry", this.id, "scrapeEntry"),
    );
  }

  async dispose() {
    for (const disposeCallback of this.disposeCallbacks) {
      disposeCallback();
    }
    PLExtAPI.extensionPreferenceService.unregister(this.id);
  }

  async scrapeEntry(payloads: any[]) {
    const startTime = Date.now();
    PLAPI.logService.info(
      `Scrape entry - start`,
      JSON.stringify(payloads),
      false,
      "EntryScrapeExt",
    )

    if (payloads.length === 0) {
      const endTime = Date.now();
      PLAPI.logService.info(
        `Scrape entry - done`,
        `Time: ${endTime - startTime}ms`,
        false,
        "EntryScrapeExt",
      )
      return [];
    }

    const paperEntityDrafts = await this._entryScrapeService.scrape(payloads);

    const endTime = Date.now();
    PLAPI.logService.info(
      `Scrape entry - done`,
      `Time: ${endTime - startTime}ms, Result: ${paperEntityDrafts.length} entities.`,
      false,
      "EntryScrapeExt",
    )
    return paperEntityDrafts;
  }
}

async function initialize() {
  const extension = new PaperlibEntryScrapeExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
