class BufferWriter {
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

  public toUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  public writeUint8Array(uint8array: Uint8Array): void {
    for (const value of uint8array) {
      this.writeUint8(value);
    }
  }

  public writeUint8(uint8: number): void {
    this.dataview.setUint8(this.offset, uint8);
    this.offset += 1;
  }

  public writeUint16(uint16: number): void {
    this.dataview.setUint16(this.offset, uint16, this.littleEndian);
    this.offset += 2;
  }

  public writeUint32(uint32: number): void {
    this.dataview.setUint32(this.offset, uint32, this.littleEndian);
    this.offset += 4;
  }

  public writeUint64(uint64: number): void {
    this.dataview.setBigUint64(this.offset, BigInt(uint64), this.littleEndian);
    this.offset += 8;
  }

  private get littleEndian(): boolean {
    return this.endian === "little";
  }
}

export { BufferWriter };
