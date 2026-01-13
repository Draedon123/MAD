import {
  BaseDirectory,
  FileHandle,
  open,
  SeekMode,
} from "@tauri-apps/plugin-fs";
import { ChapterTable, type ChapterHeader } from "./ChapterTable";
import * as uint8 from "./toUint8";
import { Manga } from "./Manga";

type Page = {
  image: ArrayBuffer;
  chapter: string;
};

class MangaFactory {
  private initialised: boolean;
  private file!: FileHandle;
  private chapterTable!: ChapterTable;
  private currentChapter!: ChapterHeader;
  private chapterIndex: number;
  private chapterByteOffset: number;
  constructor(
    private readonly localName: string,
    private readonly englishName: string | null,
    private readonly sourceURL: string,
    private readonly chapters: string[],
    private readonly coverImage: ArrayBuffer,
    private readonly path: string
  ) {
    this.initialised = false;
    this.chapterIndex = 0;
    this.chapterByteOffset = 0;
  }

  public async initialise(): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.chapterTable = ChapterTable.fromChapterNamesArray(this.chapters);
    this.file = await open(this.path, {
      write: true,
      create: true,
      truncate: true,
      baseDir: BaseDirectory.AppData,
    });

    await this.file.write(uint8.fromUint16(Manga.VERSION));

    console.log("Wrote header");

    // placeholder for chapter table
    await this.file.write(new Uint8Array(this.chapterTable.byteLength));

    const localName = uint8.fromString(this.localName);
    const englishName = this.englishName
      ? uint8.fromString(this.englishName)
      : null;

    const localNameByteLength = localName.byteLength;
    const englishNameByteLength = englishName ? englishName.byteLength : 0;

    await this.file.write(uint8.fromUint16(localNameByteLength));
    await this.file.write(localName);

    await this.file.write(uint8.fromUint16(englishNameByteLength));
    if (englishName !== null) {
      await this.file.write(englishName);
    }

    const sourceURL = uint8.fromString(this.sourceURL);
    const sourceURLByteLength = sourceURL.byteLength;

    await this.file.write(uint8.fromUint16(sourceURLByteLength));
    await this.file.write(sourceURL);

    await this.file.write(uint8.fromUint32(this.coverImage.byteLength));
    await this.file.write(new Uint8Array(this.coverImage));

    const metaDataByteLength =
      localName.byteLength +
      englishNameByteLength +
      sourceURLByteLength +
      3 * Uint16Array.BYTES_PER_ELEMENT +
      Uint32Array.BYTES_PER_ELEMENT +
      this.coverImage.byteLength;

    this.currentChapter = this.chapterTable.getChapterByIndex(0);
    this.chapterByteOffset =
      Manga.HEADER_BYTE_SIZE +
      this.chapterTable.byteLength +
      metaDataByteLength;

    this.currentChapter.byteOffset = this.chapterByteOffset;

    this.initialised = true;
  }

  public async addPage(page: Page): Promise<void> {
    if (this.currentChapter.name !== page.chapter) {
      this.currentChapter = this.chapterTable.getChapterByIndex(
        ++this.chapterIndex
      );
      this.currentChapter.byteOffset = this.chapterByteOffset;
    }

    const pageByteLength = uint8.fromUint32(page.image.byteLength);
    await this.file.write(pageByteLength);
    await this.file.write(new Uint8Array(page.image));

    const totalPageSize = page.image.byteLength + Uint32Array.BYTES_PER_ELEMENT;

    this.chapterByteOffset += totalPageSize;
    this.currentChapter.byteLength += totalPageSize;
    this.currentChapter.pageCount += 1;

    console.log(
      `Wrote Chapter ${page.chapter} Page ${this.currentChapter.pageCount}`
    );
  }

  public async finish(): Promise<void> {
    const encodedChapterTable = this.chapterTable.encode();
    await this.file.seek(Manga.HEADER_BYTE_SIZE, SeekMode.Start);
    await this.file.write(encodedChapterTable);
    await this.file.close();

    console.log("Wrote chapter table");
    console.log("Done");
  }
}

export { MangaFactory };
