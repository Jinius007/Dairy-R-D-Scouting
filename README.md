# Global Dairy R&D Scouting Tracker

A running repository of research and development across the global dairy sector — modeled after [dairy-ai-applied.vercel.app](https://dairy-ai-applied.vercel.app/) but covering the full R&D landscape, not just AI and automation.

## Features

- **12 function categories**: Animal Health, Nutrition & Feeding, Breeding & Genetics, Engineering & Automation, Robotics & AI, Quality & Food Safety, Product Development, Sustainability & Traceability, Digital Platforms, Dairy Processing, Farm Management, Animal Welfare
- **Multi-dimensional filtering**: Region, company, academic institution, R&D type, timeline, and free-text search
- **Visual analytics**: 24-month momentum chart and function breakdown pie chart
- **Chrome extension**: daily 4:00 PM IST notification (today if anything new, otherwise yesterday), plus Today / Yesterday / Week / Month / Year / All time toggles
- **Daily auto-update**: GitHub Action at 15:00 IST ingests OpenAlex, Europe PMC, Crossref, arXiv, dairy trade-press RSS, and a curated industry catalog
- **Responsive design**: Clean, modern UI inspired by the reference tracker

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Chrome extension

Load the unpacked extension from the `extension` folder:

1. Chrome → `chrome://extensions` → turn on **Developer mode**
2. **Load unpacked** → choose `extension`
3. Pin the icon (puzzle piece → pin)
4. Click the icon and pick your department

At **4:00 PM IST** each day, if Chrome is open (or the next time you open it after 4 PM), it pops **today’s** briefing when that department has new items, otherwise **yesterday’s**. In the popup you can switch Today, Yesterday, Week, Month, Year, or All time. Details: `extension/README.md`.

## Daily Ingestion

```bash
npm run ingest
```

This runs automatically via GitHub Actions at **15:00 IST** (09:30 UTC) so the feed is ready before the 16:00 IST Chrome pop. When new items are found, they are committed to `data/developments.json`.

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
