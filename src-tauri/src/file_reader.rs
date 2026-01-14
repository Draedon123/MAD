use paste::paste;
use std::{
  fs,
  io::{Read, Seek, SeekFrom},
};

pub struct FileReader {
  destroyed: bool,
  file: fs::File,
}

macro_rules! impl_read_number (( $($int:ident),* ) => {
    $(
      paste! {
        impl FileReader {
          pub fn [<read_ $int>](&mut self) -> $int {
            $int::from_le_bytes(self.read_bytes(std::mem::size_of::<$int>()).try_into().expect("Should have been able to convert vec to array"))
          }
        }
      }
    )*
});

impl_read_number!(u16, u32, u64);

impl FileReader {
  pub fn new(file: fs::File) -> Self {
    Self {
      destroyed: false,
      file,
    }
  }

  pub fn get_offset(&mut self) -> u64 {
    self
      .file
      .seek(std::io::SeekFrom::Start(0))
      .expect("Should have been able to get file seek offset")
  }

  pub fn set_offset(&mut self, offset: u64) {
    self
      .file
      .seek(SeekFrom::Start(offset))
      .expect("Should have been able to seek to offset");
  }

  pub fn skip(&mut self, bytes: i64) {
    self
      .file
      .seek(SeekFrom::Current(bytes))
      .expect("Should have been able to skip bytes");
  }

  pub fn read_bytes(&mut self, bytes: usize) -> Vec<u8> {
    let mut buffer: Vec<u8> = Vec::with_capacity(bytes);
    self
      .file
      .read(&mut buffer)
      .expect("Should have been able to read bytes");
    buffer
  }

  pub fn read_string(&mut self, bytes: usize) -> String {
    String::from_utf8(self.read_bytes(bytes)).expect("Should have been able to read string")
  }
}
