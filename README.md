# AI Notes

ИИ-ассистент для быстрых заметок и структурирования мыслей.

Записывайте мысли голосом или текстом — ИИ превращает их в задачи, тезисы, вопросы и планы.

## Возможности

- **Голосовой ввод** — надиктуйте заметку
- **Автоструктурирование** — ИИ разбивает текст на задачи, тезисы, вопросы
- **Теги** — генерируются автоматически
- **Экспорт** — Markdown, PDF, GitHub Issues
- **Синхронизация** — между устройствами через Firebase

## Стек

| Слой | Технология |
|------|-----------|
| Фронтенд | React Native (Expo SDK 52) |
| Язык | TypeScript |
| ИИ | DeepSeek API |
| Бэкенд | Firebase (Firestore + Auth) |
| Хранение | AsyncStorage (локально) |

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск веб-версии
npx expo start --web

# Запуск на iOS
npx expo start --ios

# Запуск на Android
npx expo start --android
```

## Настройка

1. Получите API ключ на [platform.deepseek.com](https://platform.deepseek.com)
2. Откройте приложение → Настройки → введите ключ
3. Начните создавать заметки

## Структура проекта

```
src/
├── screens/        # Экраны приложения
│   ├── NewNoteScreen.tsx
│   ├── NotesListScreen.tsx
│   └── SettingsScreen.tsx
├── services/       # Логика и API
│   ├── deepseek.ts   # Вызов LLM
│   ├── storage.ts    # Локальное хранение
│   ├── export.ts     # Экспорт в MD/PDF/GitHub
│   └── sync.ts       # Firebase синхронизация
├── types/          # TypeScript типы
└── config/         # Конфигурация
```

## Лицензия

MIT
