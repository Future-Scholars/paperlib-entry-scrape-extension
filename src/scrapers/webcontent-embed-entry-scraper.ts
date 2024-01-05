import { readFileSync } from "fs";
import parse from "node-html-parser";
import { PLAPI } from "paperlib-api/api";
import { PaperEntity } from "paperlib-api/model";

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
    const urlTest = urlRegExp.test(payload.value.url);

    if (!urlTest) {
      return false;
    }

    const root = parse(payload.value.document);

    const metaTags = root.querySelectorAll("meta");

    if (metaTags.length > 0) {
      let matched = false;
      for (const meta of metaTags) {
        if (
          meta.hasAttribute("name") &&
          meta.getAttribute("name") === "citation_title"
        ) {
          matched = true;
        } else if (
          meta.hasAttribute("name") &&
          meta.getAttribute("name") === "dc.Title"
        ) {
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

    const root = parse(payload.value.document);

    const metaTags = root.querySelectorAll("meta");
    if (metaTags.length > 0) {
      const entityDraft = new PaperEntity({}, true);
      let matched = false;

      const authors: string[] = [];

      for (const meta of metaTags) {
        if (
          meta.getAttribute("name") === "citation_title" ||
          meta.getAttribute("name") === "dc.Title"
        ) {
          entityDraft.title = meta.getAttribute("content") || "";
          matched = true;
        }
        if (
          meta.getAttribute("name") === "citation_author" ||
          meta.getAttribute("name") === "dc.Creator"
        ) {
          if (meta.getAttribute("content")) {
            authors.push(meta.getAttribute("content")!);
          }
        }
        if (
          meta.getAttribute("name") === "citation_publication_date" ||
          meta.getAttribute("name") == "dc.Date"
        ) {
          entityDraft.pubTime =
            meta.getAttribute("content")?.split("/")[0] || "";
        }
        if (
          meta.getAttribute("name") === "citation_doi" ||
          meta.getAttribute("name") === "dc.Identifier"
        ) {
          entityDraft.doi = meta.getAttribute("content") || "";
        }
        if (
          meta.getAttribute("name") === "citation_pdf_url" ||
          meta.getAttribute("name") === "dc.Identifier"
        ) {
          let downloadURL: string;
          if (payload.value.url.includes("adsabs.harvard.edu")) {
            downloadURL = `https://ui.adsabs.harvard.edu${meta.getAttribute(
              "content",
            )}`;
          } else {
            downloadURL = meta.getAttribute("content")!;
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
