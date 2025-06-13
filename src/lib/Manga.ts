import {
  BaseDirectory,
  FileHandle,
  open,
  SeekMode,
} from "@tauri-apps/plugin-fs";
import * as uint8 from "./toUint8";
import { FileReader } from "./FileReader";
import { ChapterTable, type ChapterHeader } from "./ChapterTable";

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

type Page = {
  image: ArrayBuffer;
  chapterName: number;
};

class Manga {
  public static readonly VERSION: number = 1;
  public static readonly HEADER_BYTE_SIZE: number =
    Uint16Array.BYTES_PER_ELEMENT;

  private readonly cache: Map<number, Chapter>;
  private readonly fileReader: FileReader;
  public chapterTable!: ChapterTable;
  public coverImageSrc!: string;
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

  public static async *create(
    mangaName: string,
    chapters: number[],
    coverImage: ArrayBuffer,
    path: string
  ): AsyncGenerator<void, Manga, Page | true> {
    let page: Page | true = yield;

    const chapterTable = ChapterTable.fromChapterNamesArray(chapters);
    const file = await open(path, {
      write: true,
      create: true,
      truncate: true,
      baseDir: BaseDirectory.AppData,
    });

    await file.write(uint8.fromUint16(Manga.VERSION));

    console.log("Wrote header");

    // placeholder for chapter table
    await file.write(new Uint8Array(chapterTable.byteLength));

    await file.write(uint8.fromUint32(coverImage.byteLength));
    await file.write(new Uint8Array(coverImage));

    const metaDataByteLength =
      Uint32Array.BYTES_PER_ELEMENT + coverImage.byteLength;

    let chapter: ChapterHeader = chapterTable.getChapterByIndex(0);
    let chapterIndex = 0;
    let chapterByteOffset =
      Manga.HEADER_BYTE_SIZE + chapterTable.byteLength + metaDataByteLength;

    chapter.byteOffset = chapterByteOffset;

    while (page !== true) {
      if (chapter.name !== page.chapterName) {
        chapter = chapterTable.getChapterByIndex(++chapterIndex);
        chapter.byteOffset = chapterByteOffset;
      }

      const pageByteLength = uint8.fromUint32(page.image.byteLength);
      await file.write(pageByteLength);
      await file.write(new Uint8Array(page.image));

      const totalPageSize =
        page.image.byteLength + Uint32Array.BYTES_PER_ELEMENT;

      chapterByteOffset += totalPageSize;
      chapter.byteLength += totalPageSize;
      chapter.pageCount += 1;

      console.log(
        `Wrote Chapter ${page.chapterName} Page ${chapter.pageCount}`
      );
      page = yield;
    }

    const encodedChapterTable = chapterTable.encode();
    await file.seek(Manga.HEADER_BYTE_SIZE, SeekMode.Start);
    await file.write(encodedChapterTable);
    await file.close();

    console.log("Wrote chapter table");

    const newFileHandle = await open(path, {
      baseDir: BaseDirectory.AppData,
      read: true,
    });

    console.log("Done");

    return new Manga(mangaName, newFileHandle);
  }

  public async getAllPages(chapterName: number): Promise<string[]> {
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

  public async getPage(
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
      for (let i = 1; i <= chapterHeader.pageCount; i++) {
        const pageSize = await this.fileReader.readUint32();

        chapter.pages[i] = {
          offset,
          src: "",
        };

        offset += Uint32Array.BYTES_PER_ELEMENT + pageSize;
        await this.fileReader.skip(pageSize);
      }
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
}

export { Manga };
