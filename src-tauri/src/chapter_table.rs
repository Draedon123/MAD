use crate::{buffer_reader::BufferReader, buffer_writer::BufferWriter, file_reader::FileReader};
use std::fs;

struct ChapterHeader {
  pub name: String,
  pub byte_offset: u64,
  pub byte_length: u64,
  pub page_count: u16,
}

struct ChapterTable {
  chapters: Vec<ChapterHeader>,
}

impl ChapterTable {
  pub const CHAPTER_HEADER_BYTE_SIZE: usize = 1 + 2 * 8 + 2;

  pub fn get_chapter_names(&self) -> Vec<&str> {
    self
      .chapters
      .iter()
      .map(|chapter| &chapter.name as &str)
      .collect()
  }

  pub fn get_chapter_by_index(&self, index: usize) -> &ChapterHeader {
    &self.chapters[index]
  }

  pub fn get_chapter_by_name(&self, name: &str) -> Option<&ChapterHeader> {
    self.chapters.iter().find(|chapter| chapter.name == name)
  }

  pub fn encode(&self) -> Vec<u8> {
    let mut buffer = BufferWriter::new(self.byte_length());

    buffer.write_u32(self.byte_length() as u32);
    buffer.write_u16(self.chapters.len() as u16);

    for chapter in &self.chapters {
      buffer.write_u8(chapter.name.len() as u8);
      buffer.write_u8_array(&mut chapter.name.to_string().into_bytes());
      buffer.write_u64(chapter.byte_offset);
      buffer.write_u64(chapter.byte_length);
      buffer.write_u16(chapter.page_count)
    }

    buffer.buffer
  }

  pub fn byte_length(&self) -> usize {
    let chapter_names_size = self
      .chapters
      .iter()
      .map(|chapter| chapter.name.len())
      .reduce(|total, current| total + current)
      .unwrap_or_else(|| 0);

    4 + 2 + self.chapters.len() * Self::CHAPTER_HEADER_BYTE_SIZE + chapter_names_size
  }

  pub fn from_file(file: fs::File) -> Self {
    let mut file_reader = FileReader::new(file);
    file_reader.set_offset(2);

    let byte_length = file_reader.read_u32();

    if byte_length == 0 {
      return Self {
        chapters: Vec::new(),
      };
    };

    let bytes_to_read = byte_length - 4;
    let buffer = file_reader.read_bytes(bytes_to_read as usize);
    let mut buffer_reader = BufferReader::new(buffer);
    let chapter_count = buffer_reader.read_u16();
    let mut chapters: Vec<ChapterHeader> = Vec::with_capacity(chapter_count as usize);

    for i in 0..chapter_count {
      let name_length = buffer_reader.read_u8();
      let name = buffer_reader.read_string(name_length as usize);

      let byte_offset = buffer_reader.read_u64();
      let byte_length = buffer_reader.read_u64();
      let page_count = buffer_reader.read_u16();

      chapters.push(ChapterHeader {
        name,
        byte_offset,
        byte_length,
        page_count,
      });
    }

    Self { chapters }
  }

  pub fn from_chapter_names_array(chapter_names: &[&str]) -> Self {
    Self {
      chapters: chapter_names
        .iter()
        .map(|chapter| ChapterHeader {
          name: chapter.to_string(),
          byte_length: 0,
          byte_offset: 0,
          page_count: 0,
        })
        .collect(),
    }
  }
}
