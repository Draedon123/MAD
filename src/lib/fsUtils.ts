import {
  exists,
  mkdir,
  readDir,
  type BaseDirectory,
  type DirEntry,
} from "@tauri-apps/plugin-fs";

async function checkAndMkdir(
  path: string,
  baseDir?: BaseDirectory
): Promise<boolean> {
  const directoryExists = await exists(path, { baseDir });

  if (!directoryExists) {
    await mkdir(path, { baseDir });
  }

  return directoryExists;
}

async function checkAndReadDir(
  path: string,
  baseDir?: BaseDirectory
): Promise<DirEntry[]> {
  const directoryExists = await checkAndMkdir(path, baseDir);

  if (!directoryExists) {
    return [];
  }

  return await readDir(path, { baseDir });
}

export { checkAndMkdir, checkAndReadDir };
