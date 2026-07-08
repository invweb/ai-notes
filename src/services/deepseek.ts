import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from '../config';
import { StructuredNote, Task } from '../types';
import { structureNoteOffline, generateTagsOffline } from './offline';

const STRUCTURE_PROMPT = `Ты — ИИ-ассистент для структурирования мыслей. 
Пользователь даст тебе сырую заметку (текст, голосовой ввод).
Проанализируй текст и верни JSON со структурированными данными.

Формат ответа (строго JSON):
{
  "title": "Краткий заголовок (до 8 слов)",
  "summary": "Суть заметки в 1-2 предложениях",
  "tasks": [
    { "id": "t1", "text": "Текст задачи", "done": false, "priority": "high|medium|low" }
  ],
  "keyPoints": ["Тезис 1", "Тезис 2"],
  "questions": ["Вопрос 1"],
  "format": "tasks|summary|checklist|plan|mixed"
}

Правила:
- Если есть действия/постановки — format: "tasks" или "checklist"
- Если есть план/этапы — format: "plan"
- Если просто мысль/идея — format: "summary"
- Если микс — format: "mixed"
- Определи priority по срочности из контекста
- Если пользователь не назвал — заголовок должен быть информативным
- Генерируй id для задач как "t1", "t2", и т.д.
- Отвечай ТОЛЬКО валидным JSON, без markdown-оберток`;

export async function structureNote(
  rawText: string,
  apiKey: string
): Promise<StructuredNote> {
  if (!apiKey) {
    return structureNoteOffline(rawText);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: STRUCTURE_PROMPT },
          { role: 'user', content: rawText },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return structureNoteOffline(rawText);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return structureNoteOffline(rawText);
    }

    let parsed: StructuredNote;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return structureNoteOffline(rawText);
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed.title || !parsed.tasks || !parsed.keyPoints) {
      return structureNoteOffline(rawText);
    }

    parsed.tasks = parsed.tasks.map((t: Task, i: number) => ({
      ...t,
      id: t.id || `t${i + 1}`,
      done: t.done || false,
      priority: t.priority || 'medium',
    }));

    return parsed;
  } catch {
    return structureNoteOffline(rawText);
  }
}

export async function generateTags(
  rawText: string,
  apiKey: string
): Promise<string[]> {
  if (!apiKey) {
    return generateTagsOffline(rawText);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Сгенерируй 3-5 тегов для заметки на русском языке. Верни JSON-массив строк: ["тег1", "тег2"]. Только JSON.',
          },
          { role: 'user', content: rawText },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return generateTagsOffline(rawText);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return generateTagsOffline(rawText);

    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*?\]/);
      return match ? JSON.parse(match[0]) : generateTagsOffline(rawText);
    }
  } catch {
    return generateTagsOffline(rawText);
  }
}
