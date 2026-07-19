import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
//
// activeTab (not broad host_permissions for arbitrary pages) — the extension
// only reads the current tab's content when the user actively invokes it
// (toolbar click, context menu, side panel). host_permissions is scoped
// specifically to bubbly's own backend + Supabase, which is what lets the
// background service worker fetch() them without hitting CORS (extension
// pages are exempt from CORS for hosts listed here — content scripts are
// NOT exempt, so all backend calls must go through the background worker).
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // WXT's own dev server (HMR, unrelated to the extension's WXT_API_URL
  // target) defaults to :3000 too — same port the Next.js web app's dev
  // server uses. Moved off it so both can run side by side locally.
  dev: {
    server: { port: 3010 },
  },
  manifest: {
    name: 'bubbly',
    description: 'Ask bubbly about whatever you’re reading, right from the tab.',
    // "tabs" is metadata-only (title/favicon/url of every open tab, for the
    // tab-attach picker) — it does NOT grant content access to tabs other
    // than the active one. Reading a picked background tab still requires
    // activating it first (see lib/tabAttach.ts), same activeTab boundary
    // as before, deliberately not broadened to host_permissions/<all_urls>.
    permissions: ['storage', 'activeTab', 'tabs', 'contextMenus', 'sidePanel', 'identity', 'scripting'],
    host_permissions: [
      'https://bubbly-web-five.vercel.app/*',
      'https://nmvbcfjiyfngxkijnflv.supabase.co/*',
      'http://localhost:3000/*',
    ],
    // No popup entrypoint (side panel replaces it), but MV3 still needs an
    // `action` entry for the toolbar button to exist at all — otherwise
    // there's nothing for setPanelBehavior's openPanelOnActionClick to bind to.
    action: {
      default_title: 'bubbly',
    },
  },
});
