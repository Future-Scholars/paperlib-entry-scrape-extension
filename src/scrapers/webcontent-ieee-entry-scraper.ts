import parse from "node-html-parser";
import { PLAPI, PaperEntity } from "paperlib-api";
import { CookieJar } from "tough-cookie";

import { AbstractEntryScraper } from "./entry-scraper";

export interface IWebcontentIEEEEntryScraperPayload {
  type: "webcontent";
  value: {
    url: string;
    document: string;
    cookies: { domain: string; name: string; value: string }[];
  };
}

export class WebcontentIEEEEntryScraper extends AbstractEntryScraper {
  // TODO: test this one
  static validPayload(payload: any) {
    if (
      !payload.hasOwnProperty("type") ||
      !payload.hasOwnProperty("value") ||
      payload.type !== "webcontent" ||
      !payload.value.hasOwnProperty("url") ||
      !payload.value.hasOwnProperty("document") ||
      !payload.value.hasOwnProperty("cookies")
    ) {
      return false;
    }
    const urlRegExp = new RegExp("^https?://ieeexplore.ieee.org/document");
    return urlRegExp.test(payload.value.url);
  }

  static async scrape(
    payload: IWebcontentIEEEEntryScraperPayload,
  ): Promise<PaperEntity[]> {
    if (!this.validPayload(payload)) {
      return [];
    }

    const cookieJar = new CookieJar();

    const root = parse(payload.value.document);
    const metaNodes = root.querySelectorAll("script");
    const meta = metaNodes.find((node) =>
      node.rawText.includes("xplGlobal.document.metadata"),
    );
    if (meta) {
      const entityDraft = new PaperEntity({}, true);
      const metaStr = meta.rawText;

      const title = metaStr.match(/"title":"(.*?)",/);
      if (title) {
        entityDraft.title = title[1];
      }
      const publication = metaStr.match(/"publicationTitle":"(.*?)",/);
      if (publication) {
        entityDraft.publication = publication[1];
      }
      const doi = metaStr.match(/"doi":"(.*?)",/);
      if (doi) {
        entityDraft.doi = doi[1];
      }
      const publicationYear = metaStr.match(/"publicationYear":"(.*?)",/);
      if (publicationYear) {
        entityDraft.pubTime = publicationYear[1];
      }

      const firstNames = metaStr.matchAll(/"firstName":"(.*?)",/g);
      const lastNames = metaStr.matchAll(/"lastNames":"(.*?)",/g);
      let firstNamesList: string[] = [];
      let lastNamesList: string[] = [];
      for (const match of firstNames) {
        firstNamesList.push(match[1]);
      }
      for (const match of lastNames) {
        lastNamesList.push(match[1]);
      }
      entityDraft.authors = firstNamesList
        .map((firstName, index) => {
          return `${firstName} ${lastNamesList[index]}`;
        })
        .join(", ");

      const pdfPath = metaStr.match(/"pdfPath":"(.*?)",/);
      const pdfAccessNode = root.querySelector(".pdf-btn-link");
      if (pdfPath && pdfAccessNode) {
        const url = `https://ieeexplore.ieee.org${pdfPath[1].replace(
          "iel7",
          "ielx7",
        )}`;

        const cookieJar: any[] = [];
        for (const cookie of payload.value.cookies) {
          cookieJar.push({
            cookieStr: `${cookie.name}=${cookie.value}; domain=${cookie.domain}`,
            currentUrl: `https://${cookie.domain}/`,
          });
        }
        try {
          let filename = url.split("/").pop() as string;
          if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
          }

          const targetUrl = await PLAPI.networkTool.downloadPDFs(
            [url],
            cookieJar as any,
          );
          if (targetUrl.length > 0) {
            entityDraft.mainURL = targetUrl[0];
          }
        } catch (e) {
          PLAPI.logService.error(
            "Failed to download PDF from IEEE",
            e as Error,
            true,
            "EntryScrapeExt",
          );
        }
      }

      return [entityDraft];
    } else {
      return [];
    }
  }
}
