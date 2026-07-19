# bubbly browser extension

Chrome side-panel companion to the bubbly web/mobile apps — ask questions or summarize whatever's
on the current tab, without leaving it. Built with [WXT](https://wxt.dev).

Reuses the same backend (`app/api/chat`, same Bearer-token auth mobile already uses via
`lib/supabase/server.ts`) — no separate API. Only `activeTab` + a couple of scoped
`host_permissions` (this backend + Supabase) are requested; the extension never reads pages in the
background, only when you actively invoke it.

## Setup

```
npm install
```

Copy the env values from the project's `.env` (Supabase URL/anon key, backend API URL — same values
as `mobile/.env`, prefixed `WXT_` instead of `EXPO_PUBLIC_`). A `.env` with the current production
values is already present locally but gitignored.

## Develop

```
npm run dev
```

Then load `.output/chrome-mv3` as an unpacked extension in `chrome://extensions` (enable Developer
Mode first). WXT hot-reloads most changes automatically.

## One-time setup: OAuth redirect

Google sign-in needs the extension's redirect URI allow-listed in Supabase (Auth → URL
Configuration), same as was done for the mobile app's `bubbly://auth/callback`. Once loaded unpacked,
open the side panel and check the console — `chrome.identity.getRedirectURL()` prints
`https://<extension-id>.chromiumapp.org/`. Add that exact URL to the allow-list. The extension ID is
stable as long as you don't remove/reload it as a *new* unpacked install.

## Build for release

```
npm run build   # .output/chrome-mv3
npm run zip      # .output/chrome-mv3.zip, ready for Chrome Web Store upload
```
