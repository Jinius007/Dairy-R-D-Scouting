# Global Dairy R&D Scouting Tracker

A running repository of research and development across the global dairy sector — modeled after [dairy-ai-applied.vercel.app](https://dairy-ai-applied.vercel.app/) but covering the full R&D landscape, not just AI and automation.

## Features

- **12 function categories**: Animal Health, Nutrition & Feeding, Breeding & Genetics, Engineering & Automation, Robotics & AI, Quality & Food Safety, Product Development, Sustainability & Traceability, Digital Platforms, Dairy Processing, Farm Management, Animal Welfare
- **Multi-dimensional filtering**: Region, company, academic institution, R&D type, timeline, and free-text search
- **Visual analytics**: 24-month momentum chart and function breakdown pie chart
- **Chrome extension**: daily 4:00 PM IST notification with this week’s and this month’s counts, plus Week / Month / Year / All time toggles in the popup
- **Daily auto-update**: GitHub Action at 15:00 IST ingests OpenAlex, Europe PMC, Crossref, arXiv, dairy trade-press RSS (including DairyNews.today), and a curated industry catalog
- **Responsive design**: Clean, modern UI inspired by the reference tracker

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome extension

Staff install from the **Chrome briefing** page on the site (`/extension`). That page downloads `dairy-rd-extension.zip`, which unzips to a folder named `dairy-rd-extension` containing `manifest.json`. In Chrome: `chrome://extensions` → Developer mode → **Load unpacked** → select that unzipped folder (not the zip file). Pin the icon and pick a department.

At **4:00 PM IST** the pop shows **this week** and **this month** counts. Details: `extension/README.md`.

## Daily Ingestion

```bash
npm run ingest
```

This runs automatically via GitHub Actions at **15:00 IST** (09:30 UTC) so the feed is ready before the 16:00 IST Chrome pop. When new items are found, they are committed to `data/developments.json`.

Trade-press sources include **DairyNews.today** (`https://dairynews.today/news/`): the English archive from 2024-01-01 is loaded from the site sitemap, and the daily GitHub Action adds/upgrades stories from RSS, the latest listing pages, and any new sitemap URLs — same 15:00 IST job as the other sources.

## Deploy to Vercel

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Deploy — no environment variables required
4. Enable Vercel's "Deploy on push" for automatic redeployment after daily ingestion

## Project Structure

```
├── data/developments.json    # Main data store
├── scripts/ingest.ts         # Daily ingestion
├── extension/                # Chrome extension
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # UI components
│   └── lib/                  # Types, utilities, filter logic
└── .github/workflows/        # Daily ingest action
```
