import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Note } from '../types';
import { getNotes, saveNotes } from './storage';

const NOTES_COLLECTION = 'notes';

export async function syncNotesToCloud(): Promise<void> {
  const user = auth().currentUser;
  if (!user) return;

  const localNotes = await getNotes();
  const batch = firestore().batch();

  for (const note of localNotes) {
    const ref = firestore()
      .collection(NOTES_COLLECTION)
      .doc(user.uid)
      .collection('user_notes')
      .doc(note.id);

    batch.set(ref, {
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    });
  }

  await batch.commit();
}

export async function fetchNotesFromCloud(): Promise<Note[]> {
  const user = auth().currentUser;
  if (!user) return [];

  const snapshot = await firestore()
    .collection(NOTES_COLLECTION)
    .doc(user.uid)
    .collection('user_notes')
    .orderBy('updatedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as Note;
  });
}

export async function mergeNotes(local: Note[], cloud: Note[]): Promise<Note[]> {
  const map = new Map<string, Note>();

  for (const n of local) {
    map.set(n.id, n);
  }

  for (const cn of cloud) {
    const existing = map.get(cn.id);
    if (!existing || cn.updatedAt > existing.updatedAt) {
      map.set(cn.id, cn);
    }
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  await saveNotes(merged);
  return merged;
}
