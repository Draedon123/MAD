import {
  BaseDirectory,
  FileHandle,
  open,
  SeekMode,
} from "@tauri-apps/plugin-fs";
import * as uint8 from "./toUint8";
import { FileReader } from "$lib/FileReader";
import { ChapterTable, type ChapterHeader } from "./ChapterTable";

type Chapter = {
  pages: HTMLImageElement[];
};

type Page = {
  image: ArrayBuffer;
  chapterName: number;
};

class Manga {
  public static readonly VERSION: number = 1;
  public static readonly HEADER_BYTE_SIZE: number =
    Uint16Array.BYTES_PER_ELEMENT;

  private readonly cachedChapters: Chapter[];
  private readonly fileReader: FileReader;
  private chapterTable!: ChapterTable;
  private initialised: boolean;
  private destroyed: boolean;
  constructor(
    public readonly name: string,
    private readonly file: FileHandle
  ) {
    this.cachedChapters = [];
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

  public static async *create(
    mangaName: string,
    chapters: number[],
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

    let chapterByteOffset = Manga.HEADER_BYTE_SIZE + chapterTable.byteLength;

    await file.write(uint8.fromUint16(Manga.VERSION));
    await file.write(uint8.fromUint16(chapters.length));

    console.log("Wrote header");

    // placeholder for chapter table
    await file.write(new Uint8Array(chapterTable.byteLength));

    let chapter: ChapterHeader = chapterTable.getChapter(0);
    let chapterIndex = 0;

    chapter.byteOffset = chapterByteOffset;

    while (page !== true) {
      if (chapter.name !== page.chapterName) {
        chapter = chapterTable.getChapter(++chapterIndex);
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
    await file.seek(
      // header + chapter table size
      Uint16Array.BYTES_PER_ELEMENT + Uint16Array.BYTES_PER_ELEMENT,
      SeekMode.Start
    );
    await file.write(encodedChapterTable);
    await file.close();

    console.log("Wrote chapter table");

    const newFileHandle = await open(path, {
      baseDir: BaseDirectory.AppData,
      read: true,
    });

    return new Manga(mangaName, newFileHandle);
  }

  // @ts-expect-error just boilerplate
  public async getChapter(): Promise<Chapter> {}

  public async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.file.close();
  }
}

export { Manga };
