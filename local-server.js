/**
 * local-server.js
 * ─────────────────────────────────────────────────────────────
 * Mirrors the production Nginx setup locally for testing:
 *   http://localhost:4200/          → Portal  (dist/mytaxfinder/browser)
 *   http://localhost:4200/admin/    → Admin   (admin/dist/MyTaxFinder/browser)
 *
 * Usage:
 *   1. npm run build:all          ← build both apps first
 *   2. node local-server.js       ← start this server
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 4200;

// ── Resolve build folders ──────────────────────────────────────────────────
// Angular 17 (portal) outputs directly to dist/mytaxfinder/ (no browser/ subfolder)
const PORTAL_DIST = fs.existsSync(path.join(__dirname, 'dist', 'mytaxfinder', 'browser'))
  ? path.join(__dirname, 'dist', 'mytaxfinder', 'browser')
  : path.join(__dirname, 'dist', 'mytaxfinder');

// Admin dist folder name depends on project name in angular.json
// Try common names automatically
const ADMIN_CANDIDATES = [
  path.join(__dirname, 'admin', 'dist', 'MyTaxFinder', 'browser'),
  path.join(__dirname, 'admin', 'dist', 'my-tax-finder', 'browser'),
  path.join(__dirname, 'admin', 'dist', 'admin', 'browser'),
];
const ADMIN_DIST = ADMIN_CANDIDATES.find(p => fs.existsSync(p));

// ── Validate build folders exist ───────────────────────────────────────────
if (!fs.existsSync(PORTAL_DIST)) {
  console.error('\n❌  Portal build not found at:', PORTAL_DIST);
  console.error('   Run: npm run build:prod\n');
  process.exit(1);
}
if (!ADMIN_DIST) {
  console.error('\n❌  Admin build not found. Tried:');
  ADMIN_CANDIDATES.forEach(p => console.error('   ', p));
  console.error('   Run: npm run admin:build:prod\n');
  process.exit(1);
}

console.log('\n✅  Portal dist :', PORTAL_DIST);
console.log('✅  Admin dist  :', ADMIN_DIST);

// ── /admin/ route — serve Admin app ───────────────────────────────────────
// Must be before the catch-all portal route
app.use('/admin', express.static(ADMIN_DIST));

// Any /admin/* deep link (e.g. /admin/dashboard) → serve admin index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(ADMIN_DIST, 'index.html'));
});

// ── / route — serve Portal app ─────────────────────────────────────────────
app.use('/', express.static(PORTAL_DIST));

// Any other route → serve portal index.html (Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(PORTAL_DIST, 'index.html'));
});

// ── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════');
  console.log('  🚀  Local Test Server Running');
  console.log('════════════════════════════════════════════');
  console.log(`  Portal  →  http://localhost:${PORT}/`);
  console.log(`  Admin   →  http://localhost:${PORT}/admin/`);
  console.log('════════════════════════════════════════════\n');
  console.log('  Press Ctrl+C to stop\n');
});
