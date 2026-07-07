import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, UserPreferences } from '../types';
import { DEFAULT_USER_PREFERENCES } from '../config';

const NOTES_KEY = '@notes';
const PREFS_KEY = '@preferences';

export async function getNotes(): Promise<Note[]> {
  const raw = await AsyncStorage.getItem(NOTES_KEY);
  if (!raw) return [];
  const notes = JSON.parse(raw);
  return notes.map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
  }));
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function addNote(note: Note): Promise<void> {
  const notes = await getNotes();
  notes.unshift(note);
  await saveNotes(notes);
}

export async function updateNote(updated: Note): Promise<void> {
  const notes = await getNotes();
  const idx = notes.findIndex((n) => n.id === updated.id);
  if (idx !== -1) {
    notes[idx] = updated;
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  await saveNotes(notes.filter((n) => n.id !== id));
}

export async function getPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return raw ? { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_USER_PREFERENCES;
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
