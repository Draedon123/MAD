import { BufferWriter } from "$lib/BufferWriter";
import type { FileReader } from "$lib/FileReader";
import { Manga } from "./Manga";
import { fromString } from "./toUint8";

type ChapterHeader = {
  name: number;
  byteOffset: number;
  byteLength: number;
  pageCount: number;
};

class ChapterTable {
  public static readonly CHAPTER_HEADER_BYTE_SIZE: number =
    8 + 3 * BigUint64Array.BYTES_PER_ELEMENT;

  constructor(private readonly chapters: ChapterHeader[] = []) {}

  public sort(): void {
    this.chapters.sort((a, b) => a.name - b.name);
  }

  public addChapter(chapter: ChapterHeader): void {
    this.chapters.push(chapter);

    if ((this.chapters.at(-2)?.name ?? -1) > chapter.name) {
      this.sort();
    }
  }

  public getChapter(index: number): ChapterHeader {
    return this.chapters.at(index) as ChapterHeader;
  }

  public encode(): Uint8Array {
    const bufferWriter = new BufferWriter(this.byteLength);
    for (const chapter of this.chapters) {
      const encodedName = fromString(chapter.name.toString().padStart(8, "0"));
      bufferWriter.writeUint8Array(encodedName);
      bufferWriter.writeUint64(chapter.byteOffset);
      bufferWriter.writeUint64(chapter.byteLength);
      bufferWriter.writeUint16(chapter.pageCount);
    }

    return bufferWriter.toUint8Array();
  }

  public static async fromFile(fileReader: FileReader): Promise<ChapterTable> {
    await fileReader.setOffset(Manga.HEADER_BYTE_SIZE);
    const chapterCount = await fileReader.readUint16();

    const chapters: ChapterHeader[] = [];

    for (let i = 0; i < chapterCount; i++) {
      const name = parseFloat(await fileReader.readString(8));
      const byteOffset = await fileReader.readUint64();
      const byteLength = await fileReader.readUint64();
      const pageCount = await fileReader.readUint16();
      const chapter = {
        name,
        byteOffset,
        byteLength,
        pageCount,
      };

      chapters.push(chapter);
    }

    return new ChapterTable(chapters);
  }

  public static fromChapterNamesArray(chapterNames: number[]): ChapterTable {
    const table = new ChapterTable(
      chapterNames.map((name) => {
        return {
          name,
          encodedName: fromString(name.toString().padStart(8, "0")),
          byteLength: 0,
          byteOffset: 0,
          pageCount: 0,
        };
      })
    );

    return table;
  }

  public get byteLength(): number {
    return (
      this.chapters.length * ChapterTable.CHAPTER_HEADER_BYTE_SIZE +
      Uint16Array.BYTES_PER_ELEMENT
    );
  }
}

export { ChapterTable, type ChapterHeader };
