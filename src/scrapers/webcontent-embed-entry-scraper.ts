import { readFileSync } from "fs";
import { PLAPI, PaperEntity } from "paperlib-api";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IWebcontentEmbedEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: string;
  };
}

export class WebcontentEmbedEntryScraper extends AbstractEntryScraper {
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "webcontent" ||
      !payload.value.hasOwnProperty("url") ||
      !payload.value.hasOwnProperty("document")
    ) {
      return false;
    }
    const urlRegExp = new RegExp("^https?://");
    const urlTest = urlRegExp.test(payload.url);

    if (!urlTest) {
      return false;
    }

    var el = document.createElement("html");
    el.innerHTML = payload.document;

    // Get meta tags
    const metaTags = el.getElementsByTagName("meta");

    if (metaTags.length > 0) {
      let matched = false;
      for (const meta of metaTags) {
        if (meta.name === "citation_title") {
          matched = true;
        }
      }

      return matched;
    } else {
      return false;
    }
  }

  static async scrape(
    payload: IWebcontentEmbedEntryScraperPayload,
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    var el = document.createElement("html");
    el.innerHTML = payload.value.document;

    // Get meta tags
    const metaTags = el.getElementsByTagName("meta");
    if (metaTags.length > 0) {
      const entityDraft = new PaperEntity({}, true);
      let matched = false;

      const authors: string[] = [];

      for (const meta of metaTags) {
        if (meta.name === "citation_title" || meta.name === "dc.Title") {
          entityDraft.title = meta.content;
          matched = true;
        }
        if (meta.name === "citation_author" || meta.name === "dc.Creator") {
          authors.push(meta.content);
        }
        if (
          meta.name === "citation_publication_date" ||
          meta.name == "dc.Date"
        ) {
          entityDraft.pubTime = meta.content.split("/")[0];
        }
        if (meta.name === "citation_doi" || meta.name === "dc.Identifier") {
          entityDraft.doi = meta.content;
        }
        // TODO: check this one.
        if (meta.name === "citation_pdf_url" || meta.name === "dc.Identifier") {
          let downloadURL: string;
          if (payload.value.url.includes("adsabs.harvard.edu")) {
            downloadURL = `https://ui.adsabs.harvard.edu${meta.content}`;
          } else {
            if (meta.content.endsWith(".pdf")) {
              downloadURL = meta.content;
            } else {
              downloadURL = meta.content + ".pdf";
            }
          }

          const downloadedFilePath = await PLAPI.networkTool.downloadPDFs([
            downloadURL,
          ]);
          if (downloadedFilePath.length > 0) {
            const fileContent = readFileSync(downloadedFilePath[0]);
            if (
              fileContent.subarray(0, 5).toString() === "%PDF-" &&
              fileContent.subarray(-5).toString().includes("EOF")
            ) {
              entityDraft.mainURL = downloadedFilePath[0];
            }
          }
        }
      }
      if (authors.length > 0) {
        entityDraft.authors = authors
          .map((author) => {
            return author.trim();
          })
          .join(", ");
      }
      if (!matched) {
        return [];
      } else {
        return [entityDraft];
      }
    } else {
      return [];
    }
  }
}
