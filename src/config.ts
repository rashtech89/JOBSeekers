// The Admin Control Center is NOT linked anywhere on the site. It opens only at this secret path.
// Set it in `.env.local` (never commit it):  VITE_ADMIN_PATH=/your-secret-path
// Hiding the link is not security: real protection comes from login + database rules (added in the Firebase phase).
const raw = ((import.meta.env.VITE_ADMIN_PATH as string | undefined) ?? '').trim()
export const ADMIN_PATH = raw ? (raw.startsWith('/') ? raw : `/${raw}`) : ''
