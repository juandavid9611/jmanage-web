# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3031
npm run build        # Production build
npm run lint         # ESLint
npm run lint:fix     # ESLint with autofix
npm run fm:check     # Prettier check
npm run fm:fix       # Prettier autoformat
```

## Architecture

React 18 + Vite SPA, based on Minimal UI Kit v6.0.1. Auth via AWS Amplify + Cognito. MUI v5 for UI. SWR + axios for data fetching. React Router v6 for routing. react-hook-form + Zod for forms.

**Path alias**: `src/` maps to `./src/` (configured in `vite.config.js`). Always use `src/utils/...` style imports, not relative paths.

### Source layout

- `src/config-global.js` — global config (server URL, Amplify credentials) read from env vars
- `src/auth/` — Amplify auth context and route guards; `useAuthContext()` provides the authenticated user
- `src/workspace/workspace-provider.jsx` — `WorkspaceProvider` context; active workspace persisted in `localStorage`; exposes `useWorkspace()` hook
- `src/actions/` — SWR-based data fetching and mutation functions, one file per domain
- `src/utils/axios.js` — centralizes `axiosInstance` (base URL from config) and the `endpoints` map
- `src/sections/` — feature UI components organized by domain (tour, tournament, calendar, etc.)
- `src/pages/` — thin route-level wrappers that render sections
- `src/routes/sections/` — route definitions
- `src/components/` — shared, reusable UI primitives
- `src/layouts/` — layout wrappers (dashboard, auth, etc.)
- `src/theme/` — MUI theme customization

### Multi-tenancy

Users belong to accounts; accounts contain workspaces. `WorkspaceProvider` manages the active workspace selection. Most API calls include workspace context. Switching workspaces updates local state and calls the backend via `updateMyWorkspace()`.

## Env vars (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_SERVER_URL` | API base URL |
| `VITE_ASSET_URL` | S3 asset URL |
| `VITE_AWS_AMPLIFY_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID` | Cognito web client ID |
| `VITE_AWS_AMPLIFY_REGION` | AWS region |
| `VITE_MAGICBELL_API_KEY` | In-app notifications |
