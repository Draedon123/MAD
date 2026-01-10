import { BufferWriter } from "$lib/BufferWriter";
import type { FileReader } from "$lib/FileReader";
import { BufferReader } from "./BufferReader";
import { Manga } from "./Manga";
import { fromString } from "./toUint8";

type ChapterHeader = {
  name: string;
  byteOffset: number;
  byteLength: number;
  pageCount: number;
};

class ChapterTable {
  public static readonly CHAPTER_HEADER_BYTE_SIZE: number =
    // Chapter name length
    Uint8Array.BYTES_PER_ELEMENT +
    // Chapter byte offset and length
    2 * BigUint64Array.BYTES_PER_ELEMENT +
    // Page count
    Uint16Array.BYTES_PER_ELEMENT;

  constructor(public readonly chapters: ChapterHeader[] = []) {}

  public getChapterNames(): string[] {
    return this.chapters.map((chapter) => chapter.name);
  }

  public getChapterByIndex(index: number): ChapterHeader {
    return this.chapters[index] as ChapterHeader;
  }

  public getChapterByName(name: string): ChapterHeader | null {
    return this.chapters.find((chapter) => chapter.name === name) ?? null;
  }

  public encode(): Uint8Array {
    const bufferWriter = new BufferWriter(this.byteLength);

    bufferWriter.writeUint32(this.byteLength);
    bufferWriter.writeUint16(this.chapters.length);
    for (const chapter of this.chapters) {
      bufferWriter.writeUint8(chapter.name.length);
      bufferWriter.writeUint8Array(fromString(chapter.name));
      bufferWriter.writeUint64(chapter.byteOffset);
      bufferWriter.writeUint64(chapter.byteLength);
      bufferWriter.writeUint16(chapter.pageCount);
    }

    return bufferWriter.toUint8Array();
  }

  public static async fromFile(fileReader: FileReader): Promise<ChapterTable> {
    await fileReader.setOffset(Manga.HEADER_BYTE_SIZE);
    const byteLength = await fileReader.readUint32();

    if (byteLength === 0) {
      return new ChapterTable();
    }

    const chapters: ChapterHeader[] = [];

    // already read a uint32
    const bytesToRead = byteLength - Uint32Array.BYTES_PER_ELEMENT;
    const buffer = await fileReader.readBytes(bytesToRead);
    const bufferReader = new BufferReader(buffer.buffer);
    const chapterCount = bufferReader.readUint16();

    for (let i = 0; i < chapterCount; i++) {
      const nameLength = bufferReader.readUint8();
      const name = bufferReader.readString(nameLength);
      const byteOffset = bufferReader.readUint64();
      const byteLength = bufferReader.readUint64();
      const pageCount = bufferReader.readUint16();
      const chapter: ChapterHeader = {
        name,
        byteOffset,
        byteLength,
        pageCount,
      };

      chapters.push(chapter);
    }

    return new ChapterTable(chapters);
  }

  public static fromChapterNamesArray(chapterNames: string[]): ChapterTable {
    const table = new ChapterTable(
      chapterNames.map((name) => {
        return {
          name,
          byteLength: 0,
          byteOffset: 0,
          pageCount: 0,
        };
      })
    );

    return table;
  }

  public get byteLength(): number {
    const chapterNamesSize = this.chapters.reduce(
      (total, current) => total + current.name.length,
      0
    );

    return (
      // Chapter table byte length
      Uint32Array.BYTES_PER_ELEMENT +
      // Chapter count
      Uint16Array.BYTES_PER_ELEMENT +
      this.chapters.length * ChapterTable.CHAPTER_HEADER_BYTE_SIZE +
      chapterNamesSize
    );
  }
}

export { ChapterTable, type ChapterHeader };
