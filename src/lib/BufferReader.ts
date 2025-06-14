class BufferReader {
  public readonly buffer: ArrayBufferLike;
  private readonly dataview: DataView;
  constructor(
    bufferOrLength: ArrayBufferLike | number = new ArrayBuffer(),
    public endian: "big" | "little" = "little",

    private offset: number = 0
  ) {
    this.buffer =
      typeof bufferOrLength === "number"
        ? new ArrayBuffer(bufferOrLength)
        : bufferOrLength;
    this.dataview = new DataView(this.buffer);
  }

  public readString(length: number): string {
    const buffer = this.readUint8Array(length);

    return new TextDecoder().decode(buffer);
  }

  public readUint8Array(length: number): Uint8Array {
    const array = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      array[i] = this.readUint8();
    }

    return array;
  }

  public readUint8(): number {
    const uint8 = this.dataview.getUint8(this.offset);
    this.offset += 1;

    return uint8;
  }

  public readUint16(): number {
    const uint16 = this.dataview.getUint16(this.offset, this.littleEndian);
    this.offset += 2;

    return uint16;
  }

  public readUint32(): number {
    const uint32 = this.dataview.getUint32(this.offset, this.littleEndian);
    this.offset += 4;

    return uint32;
  }

  public readUint64(): number {
    const uint64 = Number(
      this.dataview.getBigUint64(this.offset, this.littleEndian)
    );
    this.offset += 8;

    return uint64;
  }

  public skip(bytes: number): void {
    this.offset += bytes;
  }

  private get littleEndian(): boolean {
    return this.endian === "little";
  }
}

export { BufferReader };
