# Format

Version 1

Appended one after another, in order, without anything in between

- Header
- Chapter Table
- Metadata
- Pages

# Interfaces

## Header

uint16 - file format version

## Chapter Table

uint32 - chapter table byte length
uint16 - number of chapters

array of:

{

- uint8 - chapter name length
- chapter name, utf-8 encoded
- uint64 - chapter byte offset
- uint64 - chapter byte length
- uint16 - chapter page count

}

## Metadata

uint16 - local name byte length
local name, utf-8 encoded
uint16 - english name byte length
english name, utf-8 encoded
uint16 - source url byte length
source url
uint32 - cover image size
cover image

## Pages

array of:

{

- uint32 - page byte length
- raw image

}

# Notes

- All byte offsets are counted from the start of the file
- File format uses little endian
