use paste::paste;

pub struct BufferReader {
  pub buffer: Vec<u8>,
  offset: usize,
}

macro_rules! impl_read_number (( $($int:ident),* ) => {
    $(
      paste! {
        impl BufferReader {
          pub fn [<read_ $int>](&mut self, value: $int) -> $int {
            let value = &self.buffer[self.offset..(self.offset + std::mem::size_of::<$int>())];

            self.offset += std::mem::size_of::<$int>();

            $int::from_le_bytes(value.try_into().expect("Should have been able to convert slice to array"))
          }
        }
      }
    )*
});

impl_read_number!(u8, u16, u32, u64);

impl BufferReader {
  pub fn new(buffer: Vec<u8>) -> Self {
    Self { buffer, offset: 0 }
  }

  pub fn read_u8_array(&mut self, length: usize) -> &[u8] {
    let string = &self.buffer[self.offset..(self.offset + length)];

    self.offset += length;

    string
  }

  pub fn read_string(&self, byte_length: usize) -> String {
    String::from_utf8(self.read_u8_array(byte_length).to_vec())
      .expect("Should have been able to read string")
  }

  pub fn skip(&mut self, bytes: usize) {
    self.offset += bytes;
  }
}
