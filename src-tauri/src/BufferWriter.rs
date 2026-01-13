use paste::paste;

pub struct BufferWriter {
  pub buffer: Vec<u8>,
}

macro_rules! impl_write_number (( $($int:ident),* ) => {
    $(
      paste! {
        impl BufferWriter {
          pub fn [<write_ $int>](&mut self, value: $int) {
            self.buffer.extend_from_slice(&value.to_le_bytes());
          }
        }
      }
    )*
});

impl_write_number!(u8, u16, u32, u64);

impl BufferWriter {
  pub fn new(byte_length: usize) -> Self {
    Self {
      buffer: Vec::with_capacity(byte_length),
    }
  }

  pub fn write_u8_array(&mut self, u8_array: &mut Vec<u8>) {
    self.buffer.append(u8_array);
  }
}
