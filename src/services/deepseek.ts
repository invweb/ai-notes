import { DEEPSEEK_API_URL, DEEPSEEK_MODEL } from '../config';
import { StructuredNote, Task } from '../types';

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
    throw new Error('API ключ DeepSeek не задан');
  }

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
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API ошибка: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Пустой ответ от DeepSeek API');
  }

  let parsed: StructuredNote;
  try {
    parsed = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Не удалось распарсить ответ LLM как JSON');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  if (!parsed.title || !parsed.tasks || !parsed.keyPoints) {
    throw new Error('LLM вернул неполный JSON');
  }

  parsed.tasks = parsed.tasks.map((t: Task, i: number) => ({
    ...t,
    id: t.id || `t${i + 1}`,
    done: t.done || false,
    priority: t.priority || 'medium',
  }));

  return parsed;
}

export async function generateTags(
  rawText: string,
  apiKey: string
): Promise<string[]> {
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
  });

  if (!response.ok) return [];

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*?\]/);
    return match ? JSON.parse(match[0]) : [];
  }
}
