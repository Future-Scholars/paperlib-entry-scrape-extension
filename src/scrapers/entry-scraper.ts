import { PaperEntity } from "paperlib-api";

export abstract class AbstractEntryScraper {
  static validPayload: (payload: any) => boolean;
  static scrape: (payload: any) => Promise<PaperEntity[]>;
}
