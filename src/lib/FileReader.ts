import { SeekMode, type FileHandle } from "@tauri-apps/plugin-fs";

class FileReader {
  private destroyed: boolean;
  constructor(private readonly file: FileHandle) {
    this.destroyed = false;
  }

  public async getOffset(): Promise<number> {
    return await this.file.seek(0, SeekMode.Current);
  }

  public async setOffset(offset: number): Promise<void> {
    await this.file.seek(offset, SeekMode.Start);
  }

  public async skip(bytes: number): Promise<void> {
    await this.file.seek(bytes, SeekMode.Current);
  }

  public async readBytes(bytes: number): Promise<Uint8Array<ArrayBuffer>> {
    const FIFTY_MEGABYTES = 50 * 1024 * 1024;
    // prevent crashing
    if (import.meta.env.DEV && bytes > FIFTY_MEGABYTES) {
      throw new Error(
        `Potentially incorrect number of bytes being read (${bytes})`
      );
    }

    const buffer = new Uint8Array(bytes);

    await this.file.read(buffer);

    return buffer;
  }

  public async readUint16(): Promise<number> {
    const buffer = new Uint8Array(2);
    await this.file.read(buffer);

    return new Uint16Array(buffer.buffer)[0];
  }

  public async readUint32(): Promise<number> {
    const buffer = new Uint8Array(4);
    await this.file.read(buffer);

    return new Uint32Array(buffer.buffer)[0];
  }

  public async readUint64(): Promise<number> {
    const buffer = new Uint8Array(8);
    await this.file.read(buffer);

    return Number(new BigUint64Array(buffer.buffer)[0]);
  }

  public async readString(byteLength: number): Promise<string> {
    const buffer = new Uint8Array(byteLength);
    await this.file.read(buffer);

    return new TextDecoder().decode(buffer);
  }

  public async destroy(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    await this.file.close();
  }
}

export { FileReader };
