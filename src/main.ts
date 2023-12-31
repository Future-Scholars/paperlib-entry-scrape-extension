import { PLAPI, PLExtAPI, PLExtension } from "paperlib-api/api";

import { EntryScrapeService } from "@/services/entry-scrape-service";

class PaperlibEntryScrapeExtension extends PLExtension {
  disposeCallbacks: (() => void)[];

  private readonly _entryScrapeService: EntryScrapeService;

  constructor() {
    super({
      id: "@future-scholars/paperlib-entry-scrape-extension",
      defaultPreference: {},
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
    console.time("Scrape Entry");

    if (payloads.length === 0) {
      console.timeEnd("Scrape Entry");
      return [];
    }

    const paperEntityDrafts = await this._entryScrapeService.scrape(payloads);
    console.timeEnd("Scrape Entry");
    return paperEntityDrafts;
  }
}

async function initialize() {
  const extension = new PaperlibEntryScrapeExtension();
  await extension.initialize();

  return extension;
}

export { initialize };
