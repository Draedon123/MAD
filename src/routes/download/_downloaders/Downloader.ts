abstract class Downloader {
  constructor(public readonly url: string) {}

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  public static verify(url: string): boolean {
    throw new Error("Method not implemented");
  }
  public abstract getMangaName(): Promise<string> | string;
  public abstract getChapterNames(): Promise<string[]>;
  /**
   * @param { number } from chapter index
   * @param { number } to chapter index
   * @param handleError
   */
  public abstract download(
    from: number,
    to: number,
    handleError: (error: string) => unknown
  ): Promise<void>;

  protected static toTitleCase(string: string): string {
    return string[0].toUpperCase() + string.slice(1);
  }
}

export { Downloader };
