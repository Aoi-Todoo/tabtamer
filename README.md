# TabTamer

A Next.js landing page and working local bookmark library for TabTamer. Create collections, add links with your own titles, notes, and tags, then edit, search, or remove saved links.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Production build

```bash
pnpm build
pnpm start
```

## What's included

- Next.js App Router with TypeScript and Tailwind CSS
- Responsive navigation and page layouts
- Interactive sample library with collection filters, live search, and add/edit/delete actions
- API routes for reading and managing saved links and collections
- User-created links and collections persisted by the Next.js server in `data/tabtamer.json`
- Chrome and Edge popup extension for saving the current tab into a selected collection; see [`extension/README.md`](extension/README.md)
- Automatic one-time migration from the previous browser-local demo data
- Accessible labels, focus styles, and reduced-motion support

The six starter links are sample content. The JSON backend is intended for local development or a single persistent Node server. Serverless hosting with an ephemeral filesystem should use a hosted database instead. Sign-in, browser bookmark import/export, and session history are not connected.

## Backend endpoints

- `GET /api/library` — read saved links and custom collections
- `POST /api/links` — save a link
- `PATCH /api/links/:id` and `DELETE /api/links/:id` — update or remove a saved link
- `POST /api/collections` and `DELETE /api/collections/:name` — create or remove an empty custom collection
