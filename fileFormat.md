# Format

Version 1

Appended one after another, in order, without anything in between

- Header
- Chapter Table
- Chapters
- Pages

# Interfaces

## Header

uint16 - file format version

## Chapter Table

uint32 - chapter table byte size

array of:

{

- uint8 - chapter name byte length
- chapter name, utf-8 encoded
- uint64 - chapter byte offset
- uint64 - chapter byte length

}

## Chapters

array of:

{

- uint16 - chapter page count
- uint32 - first page byte offset

}

## Pages

array of:

{

- uint32 - page byte length
- raw image

}

# Notes

- All byte offsets are counted from the start of the file
