# Neemo Mobile

![License: MIT](https://img.shields.io/badge/license-MIT-green) ![Expo](https://img.shields.io/badge/Expo-54-000020) ![React Native](https://img.shields.io/badge/React%20Native-TypeScript-blue)

A personal finance mobile app for Filipinos, built with Expo and React Native. Neemo helps users track transactions, manage budgets, set savings goals, and get AI-powered financial insights — all from their phone.

## Overview

Neemo Mobile is the Expo/React Native companion app for the Neemo personal finance platform. It features a local-first database (Drizzle + SQLite), a rich transaction management UI, category management, and an AI chat assistant — with Filipino-specific financial context built in.

## Features

- Transaction tracking (income, expenses, transfers)
- Budget management by category
- Savings goals
- AI chat assistant for financial guidance
- Transaction templates for recurring entries
- Category and subcategory management
- Financial institution list (Philippines)
- Onboarding flow
- Profile and settings

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Expo (React Native), TypeScript |
| Database | SQLite (local), Drizzle ORM |
| State | Zustand |
| Styling | Tailwind CSS (NativeWind) |
| Auth | Custom auth (hooks + store) |
| Linting | ESLint, Prettier |

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator / Android Emulator or a physical device (the app uses native modules such as op-sqlite, so a development build is required; Expo Go is not sufficient)

### Installation

```bash
npm install
```

### Development

```bash
npx expo start
```

Native builds: `npm run android` / `npm run ios` (dev client). Web: `npm run web`. Lint: `npm run lint`.

## Project Structure

```
app/
├── (app)/                    # Main authenticated screens
│   └── (apps)/               # Core app tabs
├── onboarding.tsx            # Onboarding flow
├── transaction-templates.tsx
└── manage-categories.tsx

src/
├── db/                       # Drizzle schema, repository, and hydration
│   └── schema/
├── features/
│   ├── auth/                 # Auth components, hooks, store
│   └── finance/              # Finance components, hooks, store, types
├── lib/
│   └── constants/            # Philippine institutions, finance constants
├── providers/                # App-level providers
├── theme/                    # Design tokens and theming
└── ui/                       # Reusable UI components and layouts
```

## License

MIT. See [LICENSE](LICENSE).
