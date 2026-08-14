# Global Dairy R&D Scouting Tracker

A running repository of research and development across the global dairy sector — modeled after [dairy-ai-applied.vercel.app](https://dairy-ai-applied.vercel.app/) but covering the full R&D landscape, not just AI and automation.

## Features

- **12 function categories**: Animal Health, Nutrition & Feeding, Breeding & Genetics, Engineering & Automation, Robotics & AI, Quality & Food Safety, Product Development, Sustainability & Traceability, Digital Platforms, Dairy Processing, Farm Management, Animal Welfare
- **Multi-dimensional filtering**: Region, company, academic institution, R&D type, timeline, and free-text search
- **Visual analytics**: 24-month momentum chart and function breakdown pie chart
- **Daily auto-update**: GitHub Action ingests new items from OpenAlex, Europe PMC, Crossref, arXiv, and a curated industry catalog
- **Responsive design**: Clean, modern UI inspired by the reference tracker

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily Ingestion

The ingestion script fetches dairy R&D from OpenAlex, Europe PMC / PubMed, Crossref, arXiv, and merges a curated industry catalog (product launches, patents, conferences, co-op programmes):

```bash
npm run ingest
```

This runs automatically via GitHub Actions at 06:00 UTC daily. When new items are found, they are committed to `data/developments.json` and Vercel redeploys.

## Daily email digest (Resend)

Each morning a GitHub Action emails **today’s summary** and **this week’s summary** per department. Recipients do not log in. Your Outlook is not connected.

1. Create a free [Resend](https://resend.com) API key and store it as the GitHub secret `RESEND_API_KEY` (never commit the key).
2. Put work emails in `data/recipients.json` under each department.
3. Optional: run the **Daily department digest email** workflow and enter a test address.
4. Optional GitHub secret `RESEND_FROM` after you verify a domain (until then it uses `beth.t@example.com`).

Local test (key only in gitignored `.env.local`):

```bash
# PowerShell
$env:RESEND_API_KEY="re_..."
$env:DIGEST_TEST_TO="you@work.org"
npm run digest:email
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Deploy — no environment variables required
4. Enable Vercel's "Deploy on push" for automatic redeployment after daily ingestion

## Project Structure

```
├── data/developments.json    # Main data store
├── scripts/ingest.ts         # Daily ingestion from arXiv + Crossref
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # UI components
│   └── lib/                  # Types, utilities, filter logic
└── .github/workflows/        # Daily auto-update action
```

## Adding Manual Entries

Edit `data/developments.json` directly. Each development needs:

```json
{
  "id": "unique-id",
  "title": "...",
  "summary": "...",
  "date": "YYYY-MM-DD",
  "sourceUrl": "https://...",
  "sourceName": "...",
  "function": "Animal Health",
  "region": "USA",
  "company": "Optional Company",
  "institution": "Optional University",
  "rdType": "Research Paper",
  "tags": ["optional", "tags"]
}
```
