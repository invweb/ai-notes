export interface Note {
  id: string;
  rawText: string;
  structured: StructuredNote;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  synced: boolean;
}

export interface StructuredNote {
  title: string;
  summary: string;
  tasks: Task[];
  keyPoints: string[];
  questions: string[];
  format: 'tasks' | 'summary' | 'checklist' | 'plan' | 'mixed';
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface UserPreferences {
  defaultFormat: StructuredNote['format'];
  autoTags: boolean;
  language: 'ru' | 'en';
  theme: 'light' | 'dark' | 'system';
}

export type RootTabParamList = {
  Notes: undefined;
  NewNote: undefined;
  Settings: undefined;
};

export type NoteStackParamList = {
  NotesList: undefined;
  NoteDetail: { noteId: string };
};
