# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Peak is a multiplayer racing game built as a monorepo with three packages:
- **client**: Vite + Three.js frontend (TypeScript)
- **server**: Express + Socket.io backend (TypeScript)
- **shared**: Common types and utilities used by both client and server

## Quick Start

Run the application:
```bash
npm run dev          # Run both client and server together
```

Or run them separately:
```bash
npm run dev:server   # Server at http://localhost:3000
npm run dev:client   # Client at http://localhost:5173
```

## Development Commands

### Initial Setup
```bash
npm install                    # Install all workspace dependencies
npm run build:shared           # Build shared package (required before running client/server)
```

### Development
```bash
npm run dev                    # Run both client and server concurrently
npm run dev:client             # Run client only (http://localhost:5173)
npm run dev:server             # Run server only (http://localhost:3000)
```

### Building
```bash
npm run build                  # Build all packages (shared → server → client)
npm run build:shared           # Build shared package only
npm run build:client           # Build client only
npm run build:server           # Build server only
```

### Cleanup
```bash
npm run clean                  # Clean all dist directories across workspaces
```

## Architecture

### Monorepo Structure
This is an npm workspaces monorepo. The `shared` package is a local dependency for both `client` and `server`, referenced as `"@the-peak/shared": "*"` in their package.json files. The shared package must be built before the client or server can consume its types.

### Communication Flow
1. **Client → Server**: Socket.io events for joining game and sending player updates
   - `JOIN_GAME`: Client connects and sends username
   - `PLAYER_UPDATE`: Client sends position/rotation/velocity updates

2. **Server → Client**: Socket.io events for game state synchronization
   - `GAME_STATE`: Full game state sent to newly connected player
   - `PLAYER_JOINED`: Broadcast when a new player joins
   - `PLAYER_LEFT`: Broadcast when a player disconnects
   - `PLAYER_UPDATED`: Broadcast player position/rotation/velocity to other players

### Key Design Patterns

**Shared Types**: All Socket.io events, payloads, and data structures are defined in `shared/src/index.ts` to ensure type safety across client and server. This includes:
- `SocketEvent` enum for event names
- `Player`, `GameState`, `Vector3` interfaces
- Payload interfaces for each event type

**State Management**: Server maintains authoritative game state in memory (`gameState` object in `server/src/index.ts`). Clients receive state updates via Socket.io and render them using Three.js.

**Scene Graph**: Client uses Three.js to render players as colored boxes (`BoxGeometry`). Each remote player gets a mesh stored in `playerMeshes` object keyed by socket ID.

## Environment Variables

### Server (.env)
- `PORT`: Server port (default: 3000)
- `CLIENT_URL`: Client URL for CORS (default: http://localhost:5173)

### Client (.env)
- `VITE_SERVER_URL`: Server WebSocket URL (default: http://localhost:3000)

## Important Notes

- Always build `shared` package after modifying types before running client or server
- Server uses `tsx watch` for hot reloading in development
- Client uses Vite's HMR for development
- Socket IDs are used as player IDs throughout the codebase
- Player meshes are created with random colors for visual distinction
