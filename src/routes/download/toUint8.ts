function fromUint16(uint16: number): Uint8Array {
  const buffer = new ArrayBuffer(Uint16Array.BYTES_PER_ELEMENT);
  new DataView(buffer).setUint16(0, uint16, true);

  return new Uint8Array(buffer);
}

function fromUint32(uint32: number): Uint8Array {
  const buffer = new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT);
  new DataView(buffer).setUint32(0, uint32, true);

  return new Uint8Array(buffer);
}

function fromUint64(uint64: number): Uint8Array {
  const buffer = new ArrayBuffer(BigUint64Array.BYTES_PER_ELEMENT);
  new DataView(buffer).setBigUint64(0, BigInt(uint64), true);

  return new Uint8Array(buffer);
}

function fromString(string: string): Uint8Array {
  return new TextEncoder().encode(string);
}

export { fromUint16, fromUint32, fromUint64, fromString };
