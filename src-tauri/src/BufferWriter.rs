pub struct BufferWriter {
  pub buffer: Vec<u8>,
}

pub trait EndianRead {
  type Array: AsRef<[u8]>;
  fn to_le_bytes(self) -> Self::Array;
  fn from_le_bytes(bytes: Self::Array) -> Self;
}

impl EndianRead for u8 {
  type Array = [u8; 1];
  fn to_le_bytes(self) -> Self::Array {
    self.to_le_bytes()
  }
  fn from_le_bytes(bytes: Self::Array) -> Self {
    Self::from_le_bytes(bytes)
  }
}

impl EndianRead for u16 {
  type Array = [u8; 2];
  fn to_le_bytes(self) -> Self::Array {
    self.to_le_bytes()
  }
  fn from_le_bytes(bytes: Self::Array) -> Self {
    Self::from_le_bytes(bytes)
  }
}

impl EndianRead for u32 {
  type Array = [u8; 4];
  fn to_le_bytes(self) -> Self::Array {
    self.to_le_bytes()
  }
  fn from_le_bytes(bytes: Self::Array) -> Self {
    Self::from_le_bytes(bytes)
  }
}

impl EndianRead for u64 {
  type Array = [u8; 8];
  fn to_le_bytes(self) -> Self::Array {
    self.to_le_bytes()
  }
  fn from_le_bytes(bytes: Self::Array) -> Self {
    Self::from_le_bytes(bytes)
  }
}

impl BufferWriter {
  pub fn new(byte_length: usize) -> Self {
    Self {
      buffer: Vec::with_capacity(byte_length),
    }
  }

  pub fn write_u8_array(&mut self, u8_array: &mut Vec<u8>) {
    self.buffer.append(u8_array);
  }

  pub fn write(&mut self, value: impl EndianRead) {
    self.buffer.extend_from_slice(value.to_le_bytes().as_ref());
  }
}
