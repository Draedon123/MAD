import {
  BaseDirectory,
  FileHandle,
  open,
  readDir,
} from "@tauri-apps/plugin-fs";
import { FileReader } from "./FileReader";
import { ChapterTable, type ChapterHeader } from "./ChapterTable";
import { BufferReader } from "./BufferReader";
import * as path from "@tauri-apps/api/path";
import { browser } from "$app/environment";

type Chapter = {
  header: ChapterHeader;
  pages: Record<
    number,
    {
      src: string;
      /** relative to first page */
      offset: number;
    }
  >;
};

class Manga {
  public static readonly VERSION: number = 1;
  public static readonly HEADER_BYTE_SIZE: number =
    Uint16Array.BYTES_PER_ELEMENT;

  private readonly cache: Map<number, Chapter>;
  private readonly fileReader: FileReader;
  private readonly cachedChapterOrder: number[];
  private readonly maxCacheSize: number;
  public chapterTable!: ChapterTable;
  public coverImageSrc!: string;
  private pagesRequest: Promise<string[]> | null;
  private initialised: boolean;
  private destroyed: boolean;

  constructor(
    public readonly name: string,
    private readonly file: FileHandle
  ) {
    this.cache = new Map();
    this.destroyed = false;
    this.fileReader = new FileReader(file);
    this.initialised = false;
    this.maxCacheSize = 10;
    this.cachedChapterOrder = [];
    this.pagesRequest = null;
  }

  public async initialise(): Promise<void> {
    if (this.initialised) {
      console.warn("Manga already initialised");
      return;
    }

    this.chapterTable = await ChapterTable.fromFile(this.fileReader);
    this.coverImageSrc = await this.fetchCoverImageSrc();
    this.initialised = true;
  }

  private async fetchCoverImageSrc(): Promise<string> {
    await this.fileReader.setOffset(
      Manga.HEADER_BYTE_SIZE + this.chapterTable.byteLength
    );

    const imageSize = await this.fileReader.readUint32();
    const arrayBuffer = await this.fileReader.readBytes(imageSize);
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);

    return url;
  }

  public async dump(): Promise<void> {
    if (!this.initialised) {
      console.warn("Manga not initialised");
      return;
    }

    await this.fileReader.setOffset(0);
    const version = await this.fileReader.readUint16();

    console.log({ version, chapterTable: this.chapterTable });
  }

  public async getAllPages(chapterName: number): Promise<string[]> {
    if (this.pagesRequest === null) {
      const promise = this._getAllPages(chapterName);
      this.pagesRequest = promise;

      const pages = await promise;
      this.pagesRequest = null;

      return pages;
    } else {
      await this.pagesRequest;

      return this.getAllPages(chapterName);
    }
  }

  private async _getAllPages(chapterName: number): Promise<string[]> {
    const chapter = this.chapterTable.getChapterByName(chapterName);
    if (chapter === null) {
      throw new Error(`Could not find chapter ${chapterName}`);
    }

    const pages: string[] = [];

    for (let i = 1; i <= chapter.pageCount; i++) {
      pages.push(await this.getPage(chapterName, i));
    }

    return pages;
  }

  private async getPage(
    chapterName: number,
    pageNumber: number
  ): Promise<string> {
    const cachedChapter = this.cache.get(chapterName);
    const pageInCache =
      (cachedChapter?.pages?.[pageNumber]?.src ?? "").length > 0;
    if (pageInCache) {
      return (cachedChapter as Chapter).pages[pageNumber].src;
    }

    const chapterHeader =
      cachedChapter?.header ?? this.chapterTable.getChapterByName(chapterName);
    if (chapterHeader === null) {
      throw new Error(`Could not find chapter ${chapterName}`);
    }

    if (cachedChapter === undefined) {
      const chapter: Chapter = {
        header: chapterHeader,
        pages: {},
      };
      this.cache.set(chapterName, chapter);

      let offset = 0;
      await this.fileReader.setOffset(chapterHeader.byteOffset);
      const chapterData = await this.fileReader.readBytes(
        chapterHeader.byteLength
      );
      const bufferReader = new BufferReader(chapterData.buffer);

      for (let i = 1; i <= chapterHeader.pageCount; i++) {
        const pageSize = bufferReader.readUint32();

        chapter.pages[i] = {
          offset,
          src: "",
        };

        offset += Uint32Array.BYTES_PER_ELEMENT + pageSize;
        bufferReader.skip(pageSize);
      }

      if (this.cachedChapterOrder.length == this.maxCacheSize) {
        const chapter = this.cachedChapterOrder.shift() as number;
        this.cleanCache(chapter);
      }

      this.cachedChapterOrder.push(chapterHeader.name);
    }

    const chapter = this.cache.get(chapterName) as Chapter;
    await this.fileReader.setOffset(
      chapterHeader.byteOffset + chapter.pages[pageNumber].offset
    );
    const imageSize = await this.fileReader.readUint32();
    const image = await this.fileReader.readBytes(imageSize);
    const blob = new Blob([image]);
    const url = URL.createObjectURL(blob);

    chapter.pages[pageNumber].src = url;

    return url;
  }

  public async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    for (const chapter of Object.values(this.cache)) {
      this.cleanCache(chapter.header.name);
    }

    if (this.coverImageSrc) {
      URL.revokeObjectURL(this.coverImageSrc);
    }

    await this.file.close();
  }

  public cleanCache(chapterName: number): void {
    const chapter = this.cache.get(chapterName);

    if (chapter === undefined) {
      return;
    }

    for (const page of Object.values(chapter.pages)) {
      URL.revokeObjectURL(page.src);
    }

    this.cache.delete(chapterName);
  }

  public static async getAllInDirectory(): Promise<Manga[]> {
    if (!browser) {
      return [];
    }

    const mangaList: Manga[] = [];
    const directory = await readDir("manga", {
      baseDir: BaseDirectory.AppData,
    });

    for (const entry of directory) {
      if (entry.isDirectory || !entry.name.endsWith(".mga")) {
        continue;
      }

      const mangaName = entry.name.slice(0, -".mga".length);
      const file = await open(await path.join("manga", entry.name), {
        baseDir: BaseDirectory.AppData,
      });

      const manga = new Manga(mangaName, file);
      await manga.initialise();

      mangaList.push(manga);
    }

    return mangaList;
  }
}

export { Manga };
