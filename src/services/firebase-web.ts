import { Note } from '../types';
import { getNotes, saveNotes } from './storage';

const NOTES_STORAGE_KEY = '@notes_sync';

export interface User {
  uid: string;
  email: string | null;
}

let currentUser: User | null = null;
let authStateListeners: ((user: User | null) => void)[] = [];

export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
  authStateListeners.push(callback);

  const stored = localStorage.getItem('@firebase_user');
  if (stored) {
    currentUser = JSON.parse(stored);
    callback(currentUser);
  } else {
    callback(null);
  }

  return () => {
    authStateListeners = authStateListeners.filter((l) => l !== callback);
  };
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string
): Promise<User> {
  const users = JSON.parse(localStorage.getItem('@firebase_users') || '{}');

  if (users[email]) {
    throw new Error('auth/email-already-in-use');
  }

  const user: User = {
    uid: btoa(email).replace(/[^a-zA-Z0-9]/g, ''),
    email,
  };

  users[email] = { ...user, password };
  localStorage.setItem('@firebase_users', JSON.stringify(users));

  currentUser = user;
  localStorage.setItem('@firebase_user', JSON.stringify(user));

  setTimeout(() => {
    authStateListeners.forEach((l) => l(user));
  }, 10);

  return user;
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string
): Promise<User> {
  const users = JSON.parse(localStorage.getItem('@firebase_users') || '{}');
  const userData = users[email];

  if (!userData) {
    throw new Error('auth/user-not-found');
  }

  if (userData.password !== password) {
    throw new Error('auth/wrong-password');
  }

  const user: User = { uid: userData.uid, email: userData.email };
  currentUser = user;
  localStorage.setItem('@firebase_user', JSON.stringify(user));

  setTimeout(() => {
    authStateListeners.forEach((l) => l(user));
  }, 10);

  return user;
}

export async function signOut(): Promise<void> {
  currentUser = null;
  localStorage.removeItem('@firebase_user');
  authStateListeners.forEach((l) => l(null));
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function skipAuth(): User {
  const user: User = {
    uid: 'local_' + Date.now(),
    email: 'local@offline',
  };
  currentUser = user;
  localStorage.setItem('@firebase_user', JSON.stringify(user));
  setTimeout(() => {
    authStateListeners.forEach((l) => l(user));
  }, 10);
  return user;
}

export async function syncNotesToCloud(): Promise<void> {
  if (!currentUser) return;

  const localNotes = await getNotes();
  const syncData = {
    userId: currentUser.uid,
    notes: localNotes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
    lastSync: new Date().toISOString(),
  };

  localStorage.setItem(
    `${NOTES_STORAGE_KEY}_${currentUser.uid}`,
    JSON.stringify(syncData)
  );
}

export async function fetchNotesFromCloud(): Promise<Note[]> {
  if (!currentUser) return [];

  const data = localStorage.getItem(`${NOTES_STORAGE_KEY}_${currentUser.uid}`);
  if (!data) return [];

  const syncData = JSON.parse(data);
  return syncData.notes.map((n: Note & { createdAt: string; updatedAt: string }) => ({
    ...n,
    createdAt: new Date(n.createdAt),
    updatedAt: new Date(n.updatedAt),
  }));
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
