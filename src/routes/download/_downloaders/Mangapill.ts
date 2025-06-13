import { fetch } from "@tauri-apps/plugin-http";
import { Manga } from "../Manga";
import { Downloader } from "./Downloader";

class Mangapill extends Downloader {
  private chapterNames: number[] | null = null;
  private webpage: Document | null = null;

  private static URL_REGEX: RegExp =
    /(https:\/\/)?mangapill\.com\/manga\/[0-9]+\/[\w-]+/;
  public static override verify(url: string): boolean {
    return Mangapill.URL_REGEX.test(url);
  }

  private async getWebpage(): Promise<Document> {
    if (this.webpage !== null) {
      return this.webpage;
    }

    const webpageText = await (await fetch(this.url)).text();
    const webpage = new DOMParser().parseFromString(webpageText, "text/html");

    this.webpage = webpage;

    return webpage;
  }

  public override getMangaName(): string {
    return Downloader.toTitleCase(
      (this.url.split("/").at(-1) as string).replaceAll(
        /-./g,
        (string) => " " + string.slice(1).toUpperCase()
      )
    );
  }

  public override async getChapterNames(): Promise<number[]> {
    if (this.chapterNames !== null) {
      return this.chapterNames;
    }

    const webpage = await this.getWebpage();
    const chapters: number[] = [];

    const chapterContainer =
      webpage.getElementById("chapters")?.children[0] ?? null;
    if (chapterContainer === null) {
      throw new Error("Could not find chapter container");
    }

    for (let i = chapterContainer.children.length - 1; i >= 0; i--) {
      const child = chapterContainer.children[i];
      const textContent = child.textContent as string;
      const chapterString = textContent.slice("Chapter ".length);
      const chapterNumber = parseFloat(chapterString);

      chapters.push(chapterNumber);
    }

    this.chapterNames = chapters;

    return chapters;
  }

  private async getCoverImage(): Promise<ArrayBuffer> {
    console.log("Fetching cover image");
    const webpage = await this.getWebpage();
    const image = webpage.querySelector("img.object-cover");

    if (!(image instanceof HTMLImageElement)) {
      throw new Error("Could not get cover image");
    }

    const imageURL = image.getAttribute("data-src") as string;
    const arrayBuffer = await (
      await fetch(imageURL, {
        headers: {
          Referer: "https://mangapill.com/",
        },
      })
    ).arrayBuffer();

    return arrayBuffer;
  }

  public override async download(
    from: number,
    to: number,
    handleError: (error: string) => unknown
  ): Promise<Manga> {
    console.log("Fetching chapter names");
    const chapterNames = await this.getChapterNames();
    const chaptersToDownload = chapterNames.slice(
      chapterNames.indexOf(from),
      chapterNames.indexOf(to) + 1
    );

    const splitURL = this.url.split("/");
    const mangaNumericID = parseInt(splitURL.at(-2) as string);
    const rawMangaName = this.url.split("/").at(-1) as string;
    const coverImage = await this.getCoverImage();
    const generator = Manga.create(
      this.getMangaName(),
      chaptersToDownload,
      coverImage,
      `manga\\${this.getMangaName()}.mga`
    );

    for (const chapter of chaptersToDownload) {
      console.log(`Fetching chapter ${chapter}`);
      const webpageURL = `https://mangapill.com/chapters/${mangaNumericID}-${1e7 + 1e3 * chapter}/${rawMangaName}-chapter-${chapter}`;
      const webpageContents = await (await fetch(webpageURL)).text();
      const webpage = new DOMParser().parseFromString(
        webpageContents,
        "text/html"
      );

      const pages = webpage.querySelectorAll(
        ".js-page"
      ) as NodeListOf<HTMLImageElement>;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const url = page.getAttribute("data-src");
        if (url === null) {
          const errorMessage = `Could not get image src for Chapter ${chapter} Page ${i + 1}`;

          handleError(errorMessage);

          continue;
        }

        const image = await (
          await fetch(url, {
            headers: { Referer: "https://mangapill.com/" },
          })
        ).arrayBuffer();

        await generator.next({
          image,
          chapterName: chapter,
        });
      }
    }

    const manga = (await generator.next(true)).value;
    if (!(manga instanceof Manga)) {
      throw new Error("Generator not finished");
    }

    return manga;
  }
}

export { Mangapill };
