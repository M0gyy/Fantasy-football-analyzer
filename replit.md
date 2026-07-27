# Gridiron Engine — Fantasy Sports Command Center

## Overview
A full-stack fantasy football dashboard built with React + Vite + TypeScript on the frontend and an Express server on the backend. Features AI-powered trade analysis, start/sit decisions, live injury news, draft kit, waiver wire, power rankings, and more — all powered by the Google Gemini API.

## Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide React
- **Backend**: Express (server.ts), Google Gemini AI (`@google/genai`)
- **Build tool**: Vite 5
- **Runtime**: Node.js 20, tsx (for running TypeScript server directly)

## Running the app
```bash
npm run dev
```
Starts the Express server (which also serves the Vite dev frontend) on port 5000.

## Environment variables / secrets
| Key | Required | Purpose |
|-----|----------|---------|
| `GEMINI_API_KEY` | Yes (for AI features) | Google Gemini API — powers trade analysis, start/sit, injury news, coach chat, draft recommendations |
| `SESSION_SECRET` | Yes | Iron-session encryption for Yahoo OAuth sessions |
| `YAHOO_CLIENT_ID` | Optional | Yahoo Fantasy Sports API OAuth client ID |
| `YAHOO_CLIENT_SECRET` | Optional | Yahoo Fantasy Sports API OAuth client secret |

Set secrets via the Replit Secrets panel (never commit them to code).

## Project structure
```
server.ts          — Express backend with all /api/ai/* endpoints
src/
  App.tsx          — Root React component / router
  components/      — All dashboard views and UI components
  data/            — Mock/static data (mockData.ts, analystData.ts, nflfastrData.ts)
  utils/           — Fantasy calculators, advanced metrics, weather impact
  types.ts         — Shared TypeScript types
```

## Building for production
```bash
npm run build      # Outputs to dist/
```
In production (`NODE_ENV=production`) the Express server serves the static `dist/` folder.

## User preferences
- Keep the project's existing structure and stack.
