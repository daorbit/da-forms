# da-forms

Monorepo: React (Vite) frontend + Express backend, both TypeScript.

## Structure

```
da-forms/
├── frontend/          # Vite + React + TS
│   ├── src/
│   │   ├── app/       # root App component
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/       # api client, utils
│   │   ├── styles/
│   │   └── types/
│   ├── index.html
│   └── vite.config.ts
│
├── backend/           # Express + TS
│   └── src/
│       ├── config/    # env
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── app.ts
│       └── server.ts
│
├── .gitignore
└── README.md
```

Each app has its own `package.json`. Root `package.json` runs both together.

## Setup

```bash
npm run install:all
cp backend/.env.example backend/.env
```

## Run

```bash
npm run dev
```

- backend: http://localhost:8081
- frontend: http://localhost:3001

Vite proxies `/api/*` to `http://localhost:8081`.

Run one only: `npm run dev:backend` / `npm run dev:frontend`.

## Build

```bash
npm run build
npm start        # serves built backend
```
