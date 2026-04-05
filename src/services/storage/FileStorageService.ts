import { Paths, File, Directory } from 'expo-file-system';

/**
 * File storage service for managing reflection audio files.
 * Storage path: ${documentDirectory}/reflections/{verseId}/{noteId}.m4a
 */

const REFLECTIONS_DIR = 'reflections';

function getReflectionsDir(): Directory {
  return new Directory(Paths.document, REFLECTIONS_DIR);
}

function getVerseDir(verseId: string): Directory {
  return new Directory(Paths.document, REFLECTIONS_DIR, verseId);
}

/**
 * Get the storage path for a reflection audio file.
 */
function getReflectionPath(verseId: string, noteId: string): string {
  const file = new File(
    Paths.document,
    REFLECTIONS_DIR,
    verseId,
    `${noteId}.m4a`,
  );
  return file.uri;
}

/**
 * Ensure the directory structure exists for a verse's reflections.
 */
function ensureVerseDirExists(verseId: string): void {
  const reflDir = getReflectionsDir();
  if (!reflDir.exists) {
    reflDir.create({ intermediates: true });
  }
  const verseDir = getVerseDir(verseId);
  if (!verseDir.exists) {
    verseDir.create({ intermediates: true });
  }
}

/**
 * Save a reflection audio file from a temporary URI to permanent storage.
 * Returns the permanent file URI.
 */
async function saveReflection(
  verseId: string,
  noteId: string,
  tempUri: string,
): Promise<string> {
  ensureVerseDirExists(verseId);

  const destPath = getReflectionPath(verseId, noteId);
  const sourceFile = new File(tempUri);
  const destFile = new File(destPath);

  // Delete existing if present
  if (destFile.exists) {
    destFile.delete();
  }

  sourceFile.copy(destFile);

  return destPath;
}

/**
 * Delete a specific reflection audio file.
 */
async function deleteReflection(
  verseId: string,
  noteId: string,
): Promise<void> {
  try {
    const filePath = getReflectionPath(verseId, noteId);
    const file = new File(filePath);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Swallow — file may already be deleted
  }
}

/**
 * List all reflection note IDs for a given verse.
 * Returns an array of noteId strings (without extension).
 */
async function listReflections(verseId: string): Promise<string[]> {
  try {
    const dir = getVerseDir(verseId);
    if (!dir.exists) return [];

    const contents = dir.list();
    return contents
      .filter((item): item is File => item instanceof File)
      .filter((file) => file.uri.endsWith('.m4a'))
      .map((file) => {
        // Extract filename without extension from URI
        const parts = file.uri.split('/');
        const filename = parts[parts.length - 1] ?? '';
        return filename.replace('.m4a', '');
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export const fileStorageService = {
  getReflectionPath,
  saveReflection,
  deleteReflection,
  listReflections,
};
