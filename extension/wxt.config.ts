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
  // No manual dev.server.port here (deliberately removed — see git history):
  // pinning it to 3010 to dodge the Next.js dev server's :3000 caused the
  // sidepanel's CSP to be generated against a different origin than the one
  // Vite actually served from, blocking every dev-mode script with a CSP
  // violation. In practice the two rarely need to run at once anyway — .env's
  // WXT_API_URL points at the deployed backend, not a local Next server — so
  // this just uses WXT's own default (:3000). If you do need both running
  // together, start Next on an alternate port that session (`next dev -p 3001`)
  // rather than reintroducing this override.
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
      // Chrome treats file:// as its own permission class, separate from
      // regular http(s) host access — narrow (only local files a user
      // explicitly opens as a tab, never arbitrary web browsing) and
      // doesn't reopen the activeTab-only decision made for web pages. This
      // alone isn't enough, though: Chrome also requires the user to flip
      // "Allow access to file URLs" on this extension's chrome://extensions
      // details page by hand — that gate can't be granted from the manifest.
      'file:///*',
    ],
    // No popup entrypoint (side panel replaces it), but MV3 still needs an
    // `action` entry for the toolbar button to exist at all — otherwise
    // there's nothing for setPanelBehavior's openPanelOnActionClick to bind to.
    action: {
      default_title: 'bubbly',
    },
  },
});
