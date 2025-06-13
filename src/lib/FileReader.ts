import { SeekMode, type FileHandle } from "@tauri-apps/plugin-fs";

class FileReader {
  private destroyed: boolean;
  constructor(private readonly file: FileHandle) {
    this.destroyed = false;
  }

  public async setOffset(offset: number): Promise<void> {
    await this.file.seek(offset, SeekMode.Start);
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
