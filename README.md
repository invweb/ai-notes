# AI Notes

AI-powered assistant for quick note-taking and thought structuring.

Capture ideas by voice or text — AI transforms them into tasks, key points, questions, and plans.

## Features

- **Voice input** — dictate your notes
- **Auto-structuring** — AI breaks text into tasks, key points, and questions
- **Tags** — generated automatically
- **Export** — Markdown, PDF, GitHub Issues
- **Sync** — between devices via Firebase

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 52) |
| Language | TypeScript |
| AI | DeepSeek API |
| Backend | Firebase (Firestore + Auth) |
| Storage | AsyncStorage (local) |

## Getting Started

```bash
# Install dependencies
npm install

# Run web version
npx expo start --web

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android
```

## Configuration

1. Get an API key at [platform.deepseek.com](https://platform.deepseek.com)
2. Open the app → Settings → enter your key
3. Start creating notes

## Project Structure

```
src/
├── screens/        # App screens
│   ├── NewNoteScreen.tsx
│   ├── NotesListScreen.tsx
│   └── SettingsScreen.tsx
├── services/       # Business logic & API
│   ├── deepseek.ts   # LLM integration
│   ├── storage.ts    # Local storage
│   ├── export.ts     # Export to MD/PDF/GitHub
│   └── sync.ts       # Firebase sync
├── types/          # TypeScript types
└── config/         # Configuration
```

## Status

🚧 **Active development** — MVP is functional, work in progress on:

- [x] Real speech-to-text (not just TTS)
- [x] Firebase Auth for sync
- [x] Dark mode
- [x] Offline mode with local LLM
- [x] Web version (Expo Web)
- [x] Tags filtering
- [x] Note editing after creation

## License

MIT
