# The Peak

Multiplayer Racing Game for my College Writing Class

## Tech Stack

- **Client**: Vite + Three.js + TypeScript
- **Server**: Express + Socket.io + TypeScript
- **Shared**: Common types and utilities

## Project Structure

```
the-peak/
├── client/          # Vite + Three.js frontend
│   ├── src/
│   │   ├── main.ts
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/          # Express + Socket.io backend
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/          # Shared types and utilities
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json     # Root workspace configuration
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Server
cp server/.env.example server/.env

# Client
cp client/.env.example client/.env
```

3. Build shared package:
```bash
npm run build:shared
```

## Development

Run both client and server in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

- Client runs on: http://localhost:5173
- Server runs on: http://localhost:3000

## Production Build

Build all packages:
```bash
npm run build
```

Start the production server:
```bash
cd server
npm start
```

## Features

- Real-time multiplayer communication using WebSockets (Socket.io)
- 3D racing game environment with Three.js
- TypeScript throughout for type safety
- Monorepo structure with shared types between client and server
