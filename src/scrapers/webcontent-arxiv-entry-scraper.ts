import { PLAPI, PaperEntity } from "paperlib-api";

import { AbstractEntryScraper } from "./entry-scraper";
import { PDFEntryScraper } from "./pdf-entry-scraper";

export interface IWebcontentArXivEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: string;
  };
}

export class WebcontentArXivEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "webcontent" ||
      !payload.value.hasOwnProperty("url")
    ) {
      return false;
    }
    const urlRegExp = new RegExp(
      "^https?://([^\\.]+\\.)?(arxiv\\.org|xxx\\.lanl\\.gov)/(/\\w|abs/|pdf/)",
    );
    // TODO: check all keyname of payload, some is url.
    return urlRegExp.test(payload.value.url);
  }

  static async scrape(
    payload: IWebcontentArXivEntryScraperPayload,
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const arXivID = payload.value.url.split("/")[4].replace(".pdf", "");

    if (arXivID) {
      const downloadURL = `https://arxiv.org/pdf/${arXivID}.pdf`;

      const downloadedFilePath = await PLAPI.networkTool.downloadPDFs([
        downloadURL,
      ]);

      return PDFEntryScraper.scrape({
        type: "file",
        value: downloadedFilePath[0],
      });
    } else {
      return [];
    }
  }
}
