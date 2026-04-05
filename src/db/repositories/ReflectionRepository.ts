import type { SQLiteDatabase } from 'expo-sqlite';
import type { VoiceReflection } from '../../types/models';

interface ReflectionRow {
  note_id: string;
  verse_id: string;
  audio_file_uri: string;
  duration_seconds: number;
  created_at: string;
}

function rowToReflection(row: ReflectionRow): VoiceReflection {
  return {
    noteId: row.note_id,
    verseId: row.verse_id,
    audioFileUri: row.audio_file_uri,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  };
}

export class ReflectionRepository {
  constructor(private db: SQLiteDatabase) {}

  async save(reflection: VoiceReflection): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO reflections (note_id, verse_id, audio_file_uri, duration_seconds, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reflection.noteId,
        reflection.verseId,
        reflection.audioFileUri,
        reflection.durationSeconds,
        reflection.createdAt,
      ],
    );
  }

  async getByVerseId(verseId: string): Promise<VoiceReflection[]> {
    const rows = await this.db.getAllAsync<ReflectionRow>(
      'SELECT * FROM reflections WHERE verse_id = ? ORDER BY created_at DESC',
      [verseId],
    );
    return rows.map(rowToReflection);
  }

  async delete(noteId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM reflections WHERE note_id = ?', [noteId]);
  }

  async getAll(): Promise<VoiceReflection[]> {
    const rows = await this.db.getAllAsync<ReflectionRow>(
      'SELECT * FROM reflections ORDER BY created_at DESC',
    );
    return rows.map(rowToReflection);
  }
}
