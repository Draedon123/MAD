import { FileHandle, open } from "@tauri-apps/plugin-fs";
import { FileReader } from "./FileReader";
import { ChapterTable, type ChapterHeader } from "./ChapterTable";
import { BufferReader } from "./BufferReader";
import * as path from "@tauri-apps/api/path";
import { browser } from "$app/environment";
import { checkAndReadDir } from "./fsUtils";

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
  public localName!: string;
  public englishName!: string | null;
  public sourceURL!: string;
  public chapterTable!: ChapterTable;
  public coverImageSrc!: string;
  private pagesRequest: Promise<string[]> | null;
  private initialised: boolean;
  private destroyed: boolean;

  constructor(private readonly file: FileHandle) {
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

    if (this.chapterTable.chapters.length === 0) {
      return;
    }

    await this.fileReader.setOffset(
      Manga.HEADER_BYTE_SIZE + this.chapterTable.byteLength
    );

    const localNameByteLength = await this.fileReader.readUint16();
    const localName = await this.fileReader.readString(localNameByteLength);
    const englishNameByteLength = await this.fileReader.readUint16();
    const englishName =
      englishNameByteLength === 0
        ? null
        : await this.fileReader.readString(englishNameByteLength);

    const sourceURLByteLength = await this.fileReader.readUint16();
    const sourceURL = await this.fileReader.readString(sourceURLByteLength);

    const coverImageSize = await this.fileReader.readUint32();
    const arrayBuffer = await this.fileReader.readBytes(coverImageSize);
    const blob = new Blob([arrayBuffer]);
    const coverImageSrc = URL.createObjectURL(blob);

    this.localName = localName;
    this.englishName = englishName;
    this.sourceURL = sourceURL;
    this.coverImageSrc = coverImageSrc;

    this.initialised = true;
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

  public async getAllPages(chapterIndex: number): Promise<string[]> {
    if (this.pagesRequest === null) {
      const promise = this._getAllPages(chapterIndex);
      this.pagesRequest = promise;

      const pages = await promise;
      this.pagesRequest = null;

      return pages;
    } else {
      await this.pagesRequest;

      return this.getAllPages(chapterIndex);
    }
  }

  private async _getAllPages(chapterIndex: number): Promise<string[]> {
    const chapter = this.chapterTable.getChapterByIndex(chapterIndex);
    if (chapter === null) {
      throw new Error(`Could not find chapter with index ${chapterIndex}`);
    }

    const pages: string[] = [];

    for (let i = 1; i <= chapter.pageCount; i++) {
      pages.push(await this.getPage(chapterIndex, i));
    }

    return pages;
  }

  private async getPage(
    chapterIndex: number,
    pageNumber: number
  ): Promise<string> {
    const cachedChapter = this.cache.get(chapterIndex);
    const pageInCache =
      (cachedChapter?.pages?.[pageNumber]?.src ?? "").length > 0;
    if (pageInCache) {
      return (cachedChapter as Chapter).pages[pageNumber].src;
    }

    const chapterHeader =
      cachedChapter?.header ??
      this.chapterTable.getChapterByIndex(chapterIndex);
    if (chapterHeader === null) {
      throw new Error(`Could not find chapter with index ${chapterIndex}`);
    }

    if (cachedChapter === undefined) {
      const chapter: Chapter = {
        header: chapterHeader,
        pages: {},
      };
      this.cache.set(chapterIndex, chapter);

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

      this.cachedChapterOrder.push(chapterIndex);
    }

    const chapter = this.cache.get(chapterIndex) as Chapter;
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

    console.log(`Destroying ${this.localName}`);

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
    const directoryPath = await path.resolve(await path.appDataDir(), "manga");
    const directory = await checkAndReadDir(directoryPath);

    for (const entry of directory) {
      if (entry.isDirectory || !entry.name.endsWith(".mga")) {
        continue;
      }

      const mangaPath = await path.join(directoryPath, entry.name);
      const manga = await Manga.fromFilePath(mangaPath);

      if (manga.chapterTable.chapters.length > 0) {
        mangaList.push(manga);
      }
    }

    return mangaList;
  }

  public static async fromFilePath(mangaPath: string): Promise<Manga> {
    const file = await open(mangaPath);

    const manga = new Manga(file);
    await manga.initialise();

    return manga;
  }
}

export { Manga };
