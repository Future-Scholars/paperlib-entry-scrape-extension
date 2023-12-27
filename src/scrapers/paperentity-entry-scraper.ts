import { PaperEntity } from "paperlib-api";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IPaperEntityEntryScraperPayload {
  type: "paperEntity";
  value: PaperEntity;
}

export class PaperEntityEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any): boolean {
    if (payload.type !== "paperEntity") {
      return false;
    }

    let valid = true;
    for (const p of Object.keys(PaperEntity.schema.properties)) {
      if (p in payload.value) {
        continue;
      } else {
        valid = false;
        break;
      }
    }

    return valid;
  }
  static async scrape(
    payload: IPaperEntityEntryScraperPayload,
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const paperEntityDraft = new PaperEntity({}, false);

    for (const p of Object.keys(payload.value)) {
      paperEntityDraft[p] = payload.value[p];
    }

    return [paperEntityDraft];
  }
}
