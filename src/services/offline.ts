import { StructuredNote, Task } from '../types';

function extractTitle(text: string): string {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length <= 50) return firstLine;
    return firstLine.substring(0, 47) + '...';
  }
  return 'Заметка';
}

function extractTasks(text: string): Task[] {
  const tasks: Task[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    const taskPatterns = [
      /^[-*]\s*\[[ x]\]\s*(.+)/,
      /^[-*]\s*(надо|нужно|сделать|выполнить|важно)[:\s]*(.+)/i,
      /^[-*]\s*(todo|task)[:\s]*(.+)/i,
      /^(\d+[.)]\s*.+)/,
    ];

    for (const pattern of taskPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const text = match[1] || match[0];
        const done = trimmed.includes('[x]') || trimmed.includes('[X]');
        tasks.push({
          id: `t${tasks.length + 1}`,
          text: text.replace(/^[-*]\s*/, '').trim(),
          done,
          priority: detectPriority(text),
        });
        break;
      }
    }
  }

  return tasks;
}

function detectPriority(text: string): 'high' | 'medium' | 'low' {
  const highPriority = /срочно|важно|крайне|asap|critical/i;
  const lowPriority = /когда-нибудь|потом|позднее|low priority/i;

  if (highPriority.test(text)) return 'high';
  if (lowPriority.test(text)) return 'low';
  return 'medium';
}

function extractKeyPoints(text: string): string[] {
  const points: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const point = trimmed.replace(/^[-*]\s*/, '').trim();
      if (point && point.length > 10 && !point.match(/^(надо|нужно|сделать)/i)) {
        points.push(point);
      }
    }
  }

  if (points.length === 0) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 15);
    for (const sentence of sentences.slice(0, 3)) {
      points.push(sentence.trim());
    }
  }

  return points.slice(0, 5);
}

function extractQuestions(text: string): string[] {
  const questions: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.endsWith('?') || trimmed.match(/^(вопрос|question)[:\s]/i)) {
      questions.push(trimmed.replace(/^(вопрос|question)[:\s]/i, '').trim());
    }
  }

  return questions.slice(0, 5);
}

function detectFormat(
  tasks: Task[],
  keyPoints: string[],
  questions: string[],
  text: string
): StructuredNote['format'] {
  if (tasks.length > 2) {
    const allDone = tasks.every((t) => t.done);
    return allDone ? 'checklist' : 'tasks';
  }

  if (text.match(/(план|этап|шаг|стадия|фаза)/i)) {
    return 'plan';
  }

  if (questions.length > 1) {
    return 'summary';
  }

  if (tasks.length > 0 && keyPoints.length > 0) {
    return 'mixed';
  }

  return 'summary';
}

export function structureNoteOffline(rawText: string): StructuredNote {
  const tasks = extractTasks(rawText);
  const keyPoints = extractKeyPoints(rawText);
  const questions = extractQuestions(rawText);
  const title = extractTitle(rawText);

  const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim());
  const summary = sentences.slice(0, 2).join('. ').trim() || rawText.substring(0, 100);

  const format = detectFormat(tasks, keyPoints, questions, rawText);

  return {
    title,
    summary: summary.length > 200 ? summary.substring(0, 197) + '...' : summary,
    tasks,
    keyPoints,
    questions,
    format,
  };
}

export function generateTagsOffline(rawText: string): string[] {
  const tags: string[] = [];
  const lowerText = rawText.toLowerCase();

  const tagPatterns: [RegExp, string][] = [
    [/(工作|работа|проект|задача)/i, 'работа'],
    [/(встреча|meeting|собрание)/i, 'встреча'],
    [/(идея|idea|план|планы)/i, 'идеи'],
    [/(важно|important|срочно)/i, 'важное'],
    [/(покупки|магазин|купить)/i, 'покупки'],
    [/(здоровье|спорт|тренировка)/i, 'здоровье'],
    [/(учёба|обучение|курс|книга)/i, 'обучение'],
    [/(финансы|деньги|бюджет)/i, 'финансы'],
    [/(путешествие|поездка|отпуск)/i, 'путешествия'],
    [/(дом|квартира|ремонт)/i, 'дом'],
  ];

  for (const [pattern, tag] of tagPatterns) {
    if (pattern.test(lowerText)) {
      tags.push(tag);
    }
  }

  if (tags.length === 0) {
    const words = rawText.split(/\s+/).filter((w) => w.length > 4);
    const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))];
    tags.push(...uniqueWords.slice(0, 3));
  }

  return tags.slice(0, 5);
}

export function isOnline(): boolean {
  return true;
}
