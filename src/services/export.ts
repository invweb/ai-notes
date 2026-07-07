import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Note } from '../types';

export function noteToMarkdown(note: Note): string {
  const { structured, tags } = note;
  let md = `# ${structured.title}\n\n`;
  md += `> ${structured.summary}\n\n`;

  if (structured.tasks.length > 0) {
    md += `## Задачи\n\n`;
    for (const t of structured.tasks) {
      const checkbox = t.done ? '[x]' : '[ ]';
      const priority = t.priority === 'high' ? ' 🔴' : t.priority === 'low' ? ' 🟢' : '';
      md += `- ${checkbox} ${t.text}${priority}\n`;
    }
    md += '\n';
  }

  if (structured.keyPoints.length > 0) {
    md += `## Ключевые тезисы\n\n`;
    for (const kp of structured.keyPoints) {
      md += `- ${kp}\n`;
    }
    md += '\n';
  }

  if (structured.questions.length > 0) {
    md += `## Вопросы\n\n`;
    for (const q of structured.questions) {
      md += `- ${q}\n`;
    }
    md += '\n';
  }

  if (tags.length > 0) {
    md += `---\n\n**Теги:** ${tags.map((t) => `\`${t}\``).join(' ')}\n`;
  }

  return md;
}

export async function exportMarkdown(note: Note): Promise<void> {
  const md = noteToMarkdown(note);
  const path = `${FileSystem.documentDirectory}${note.structured.title || 'note'}.md`;
  await FileSystem.writeAsStringAsync(path, md);
  await Sharing.shareAsync(path);
}

export async function exportPDF(note: Note): Promise<void> {
  const md = noteToMarkdown(note);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; line-height: 1.6; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #007AFF; padding-bottom: 8px; }
        h2 { color: #333; margin-top: 24px; }
        blockquote { color: #666; border-left: 3px solid #007AFF; padding-left: 12px; margin: 16px 0; }
        li { margin: 4px 0; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>${note.structured.title}</h1>
      <blockquote>${note.structured.summary}</blockquote>
      ${note.structured.tasks.length > 0 ? `
        <h2>Задачи</h2>
        <ul>
          ${note.structured.tasks.map(t => `
            <li>${t.done ? '✅' : '⬜'} ${t.text} ${t.priority === 'high' ? '🔴' : ''}</li>
          `).join('')}
        </ul>
      ` : ''}
      ${note.structured.keyPoints.length > 0 ? `
        <h2>Ключевые тезисы</h2>
        <ul>${note.structured.keyPoints.map(kp => `<li>${kp}</li>`).join('')}</ul>
      ` : ''}
      ${note.structured.questions.length > 0 ? `
        <h2>Вопросы</h2>
        <ul>${note.structured.questions.map(q => `<li>${q}</li>`).join('')}</ul>
      ` : ''}
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}

export function noteToGitHubIssue(note: Note): { title: string; body: string } {
  const { structured, tags } = note;
  let body = `## ${structured.summary}\n\n`;

  if (structured.tasks.length > 0) {
    body += `### Задачи\n\n`;
    for (const t of structured.tasks) {
      body += `- [${t.done ? 'x' : ' '}] ${t.text}\n`;
    }
    body += '\n';
  }

  if (structured.keyPoints.length > 0) {
    body += `### Ключевые тезисы\n\n`;
    for (const kp of structured.keyPoints) {
      body += `- ${kp}\n`;
    }
  }

  if (tags.length > 0) {
    body += `\n---\n**Labels:** ${tags.join(', ')}`;
  }

  return { title: structured.title, body };
}
