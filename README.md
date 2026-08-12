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

Each app has its own `package.json` and is installed/run independently.

## Setup

```bash
cd backend && npm install && cp .env.example .env
cd ../frontend && npm install
```

## Run (two terminals)

```bash
cd backend  && npm run dev   # http://localhost:4000
cd frontend && npm run dev   # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:4000`.

## Build

```bash
cd backend  && npm run build && npm start
cd frontend && npm run build
```
