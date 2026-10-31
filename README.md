# Job Seekers — International Job Portal Starter

A React + TypeScript + Vite multi-page frontend prototype for the planned Job Seekers portal.

## Current status

This is a **frontend starter/prototype**, not a production-ready job portal. Firebase is not connected. Demo job listings are local sample data. The upload page only selects and previews files in the browser; it does not upload, save, publish, OCR, or delete them. Authentication, real admin permissions, storage, scheduled cleanup, comments, notifications, analytics, and CMS persistence must be implemented and tested before production.

## Included in this starter

- Multi-page routes for Home, Jobs, Job Details, Companies, Login, Register, Employer, Upload, Admin, Contact, Help, Safety, Privacy, Terms and Cookies.
- Premium navy/teal design with subtle 3D-inspired hero visuals and page-entry transitions.
- Responsive layout and reduced-motion support.
- Demo job cards, basic search filters, job detail route.
- Image-only vs professional-details upload mode UI and multi-file selection preview.
- Conditional contact action UI for phone, email, WhatsApp, map and apply URL fields.
- Footer with editable placeholder social links and legal/support navigation.
- Searchable three-line page drawer covering Home, Jobs, Login/Register, employer pages, support and legal pages.
- Prototype Admin Control Center with logo/header-cover upload previews, site name/tagline, color and footer-description settings; settings save locally in the current browser only.
- TypeScript data model for jobs and WhatsApp URL helper.

## Run locally

Requires a current Node.js LTS release.

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Next implementation phases

1. Confirm logo, domain, languages and content policy.
2. Connect Firebase Authentication and implement role-based authorization.
3. Configure Firestore schema and deny-by-default security rules.
4. Choose a storage provider and review pricing/limits before bulk image upload.
5. Implement resumable uploads, batches, OCR review, moderation and safe publication.
6. Implement comments, official admin replies, notifications and reports.
7. Build persistent Admin CMS, page builder, settings, audit logs and backups.
8. Implement scheduled expiry/archive and confirmed permanent deletion.
9. Add SEO rendering strategy, sitemap, robots, canonical tags, structured data and Search Console instructions.
10. Test in staging; production deployment requires explicit approval.

## Security notes

- Never put service-account keys or privileged secrets in frontend code or a public repository.
- A hidden `/admin` link is not security. Every privileged action must be authorized in trusted backend/database rules.
- Do not publish unverified contact data extracted by OCR.
- Permanent deletion should require confirmation and a tested retention/restore policy.
- Do not enable billing, buy a domain, or deploy to a live site without approval.
