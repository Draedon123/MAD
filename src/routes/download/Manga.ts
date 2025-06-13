import {
  BaseDirectory,
  FileHandle,
  open,
  SeekMode,
} from "@tauri-apps/plugin-fs";
import * as uint8 from "./toUint8";
import { FileReader } from "$lib/FileReader";
import { BufferWriter } from "$lib/BufferWriter";

type Chapter = {
  pages: HTMLImageElement[];
};

type ChapterHeader = {
  name: string;
  encodedName: Uint8Array;
  byteOffset: number;
  byteLength: number;
  pageCount: number;
};

type Page = {
  image: ArrayBuffer;
  chapterName: string;
};

class Manga {
  public static readonly VERSION: number = 1;
  private destroyed: boolean;
  private readonly cachedChapters: Chapter[];
  private readonly fileReader: FileReader;
  constructor(
    public readonly name: string,
    private readonly file: FileHandle
  ) {
    this.cachedChapters = [];
    this.destroyed = false;
    this.fileReader = new FileReader(file);
  }

  private async dump(): Promise<void> {
    const version = await this.fileReader.readUint16();
    const chapterCount = await this.fileReader.readUint16();

    const chapters = [];

    for (let i = 0; i < chapterCount; i++) {
      const name = parseFloat(await this.fileReader.readString(8));
      const byteOffset = await this.fileReader.readUint64();
      const byteLength = await this.fileReader.readUint64();
      const pageCount = await this.fileReader.readUint16();
      const chapter = {
        name,
        byteOffset,
        byteLength,
        pageCount,
      };

      chapters.push(chapter);
    }

    console.log({ version, chapterCount, chapters });
  }

  public static async *create(
    mangaName: string,
    chapters: number[],
    path: string
  ): AsyncGenerator<void, Manga, Page | true> {
    let page: Page | true = yield;

    const file = await open(path, {
      write: true,
      create: true,
      truncate: true,
      baseDir: BaseDirectory.AppData,
    });
    const chapterTable: ChapterHeader[] = chapters.map((name) => {
      const nameAsString = name.toString();
      return {
        name: nameAsString,
        encodedName: uint8.fromString(nameAsString.padStart(8, "0")),
        byteLength: 0,
        byteOffset: 0,
        pageCount: 0,
      };
    });
    const chapterHeaderByteSize = 8 + 3 * BigUint64Array.BYTES_PER_ELEMENT;
    const chapterTableByteLength =
      chapterTable.length * chapterHeaderByteSize +
      Uint16Array.BYTES_PER_ELEMENT;

    let chapterByteOffset =
      Uint16Array.BYTES_PER_ELEMENT + chapterTableByteLength;

    await file.write(uint8.fromUint16(Manga.VERSION));
    await file.write(uint8.fromUint16(chapters.length));

    console.log("Wrote header");

    // placeholder for chapter table
    await file.write(new Uint8Array(chapterTableByteLength));

    let chapter: ChapterHeader = chapterTable[0];
    let chapterIndex = 0;

    chapter.byteOffset = chapterByteOffset;

    while (page !== true) {
      if (chapter.name !== page.chapterName) {
        chapter = chapterTable[++chapterIndex];
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

    const chapterTableWriter = new BufferWriter(chapterTableByteLength);
    for (const chapter of chapterTable) {
      chapterTableWriter.writeUint8Array(chapter.encodedName);
      chapterTableWriter.writeUint64(chapter.byteOffset);
      chapterTableWriter.writeUint64(chapter.byteLength);
      chapterTableWriter.writeUint16(chapter.pageCount);
    }

    const encodedChapterTable = chapterTableWriter.toUint8Array();
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
