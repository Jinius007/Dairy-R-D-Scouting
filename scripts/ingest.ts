/**
 * Daily / bulk ingestion — arXiv, Crossref, OpenAlex, Europe PMC
 * Run: npm run ingest          (fills to 200+ if the catalog is short)
 *      npm run ingest -- --bulk
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Development,
  FunctionCategory,
  RDType,
  DevelopmentsData,
} from '../src/lib/types';
import { CURATED_INDUSTRY } from './curated-industry';

const DATA_PATH = path.join(process.cwd(), 'data', 'developments.json');
const MAILTO = 'dairy-rd-scouting@example.com';
const UA = `DairyRDScouting/1.0 (mailto:${MAILTO})`;

const DAIRY_RE =
  /\b(dairy|cattle|bovine|holstein|jersey|milking|mastitis|rumen|udder|heifer|cheese|whey|cow'?s milk|dairy cow|dairy farm|casein|lactose|yogurt|yoghurt|mozzarella|cheddar|ghee|kefir|colostrum|teat|parlor|parlour|somatic cell|silage|forage|calving|ketosis|lameness|girolando|buffalo milk|goat milk|sheep milk|ewe milk)\b/i;

const NOT_DAIRY_RE =
  /\b(breastfeed|breast-feed|breastfeeding|breast milk|human milk|lactation consultant|term infant|newborn infant|maternal lactation)\b/i;

const FUNCTION_KEYWORDS: Record<FunctionCategory, string[]> = {
  'Animal Health': ['mastitis', 'disease', 'vaccine', 'health', 'lameness', 'respiratory', 'antibiotic', 'immun', 'ketosis', 'metritis', 'pathogen', 'infection', 'scc', 'somatic'],
  'Nutrition & Feeding': ['feed', 'nutrition', 'diet', 'rumen', 'forage', 'supplement', 'methane', 'microbiome', 'tmr', 'silage', 'additive', 'protein', 'energy balance'],
  'Breeding & Genetics': ['genomic', 'genetic', 'breeding', 'crispr', 'semen', 'embryo', 'heritable', 'snp', 'gwas', 'fertility', 'inbreeding', 'genotype'],
  'Engineering & Automation': ['milking system', 'automation', 'equipment', 'engineering', 'solar', 'parlor', 'parlour', 'cooling', 'heat recovery', 'pasteur'],
  'Robotics & AI': ['robot', 'artificial intelligence', 'machine learning', 'deep learning', 'computer vision', 'neural', 'ams', 'automatic milking'],
  'Quality & Food Safety': ['contamination', 'safety', 'quality', 'pathogen', 'antibiotic residue', 'listeria', 'salmonella', 'aflatoxin', 'adulterat'],
  'Product Development': ['fermentation', 'alternative protein', 'lactose-free', 'functional', 'formulation', 'a2', 'yogurt', 'probiotic', 'infant formula'],
  'Sustainability & Traceability': ['carbon', 'sustainability', 'traceability', 'blockchain', 'emission', 'environment', 'lca', 'net zero', '3-nop', 'bovaer'],
  'Digital Platforms & Innovation': ['iot', 'cloud', 'platform', 'digital', 'analytics', 'sensor', 'wearable', 'app', 'software', 'decision support'],
  'Dairy Processing': ['cheese', 'whey', 'homogenization', 'pasteurization', 'membrane', 'processing', 'ultrafiltration', 'spray dry', 'evaporat'],
  'Farm Management': ['pasture', 'grazing', 'farm management', 'herd', 'precision agriculture', 'drone', 'irrigation', 'labor', 'workforce'],
  'Animal Welfare': ['welfare', 'stress', 'behavior', 'behaviour', 'cow-calf', 'comfort', 'heat stress', 'lying time', 'stocking', 'enrichment'],
};

const COUNTRY_CODES: Record<string, string> = {
  US: 'USA', GB: 'UK', NL: 'Netherlands', DE: 'Germany', FR: 'France', IE: 'Ireland',
  DK: 'Denmark', SE: 'Sweden', FI: 'Finland', NO: 'Norway', CH: 'Switzerland',
  IT: 'Italy', ES: 'Spain', PL: 'Poland', IN: 'India', CN: 'China', JP: 'Japan',
  AU: 'Australia', NZ: 'New Zealand', BR: 'Brazil', AR: 'Argentina', KE: 'Kenya',
  ZA: 'South Africa', IL: 'Israel', MX: 'Mexico', BE: 'Belgium', KR: 'South Korea',
  AT: 'Austria', PT: 'Portugal', TR: 'Turkey', PK: 'Pakistan', BD: 'Bangladesh',
  VN: 'Vietnam', TH: 'Thailand', EG: 'Egypt', ET: 'Ethiopia', UG: 'Uganda',
  TZ: 'Tanzania', CA: 'Canada', CZ: 'Czech Republic', HU: 'Hungary', RO: 'Romania',
  GR: 'Greece', CL: 'Chile', CO: 'Colombia', PE: 'Peru', UY: 'Uruguay',
  SA: 'Saudi Arabia', AE: 'UAE', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', TW: 'Taiwan', HK: 'Hong Kong', RU: 'Russia', UA: 'Ukraine',
  NG: 'Nigeria', GH: 'Ghana', MA: 'Morocco', TN: 'Tunisia', IR: 'Iran',
  IQ: 'Iraq', LK: 'Sri Lanka', NP: 'Nepal', MM: 'Myanmar', KH: 'Cambodia',
  SK: 'Slovakia', SI: 'Slovenia', HR: 'Croatia', RS: 'Serbia', BG: 'Bulgaria',
  LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia', IS: 'Iceland', LU: 'Luxembourg',
};

const REGION_KEYWORDS: [string, string][] = [
  ['united states', 'USA'], ['usa', 'USA'], ['wageningen', 'Netherlands'],
  ['netherlands', 'Netherlands'], ['germany', 'Germany'], ['france', 'France'],
  ['united kingdom', 'UK'], ['uk ', 'UK'], ['ireland', 'Ireland'], ['teagasc', 'Ireland'],
  ['canada', 'Canada'], ['australia', 'Australia'], ['new zealand', 'New Zealand'],
  ['india', 'India'], ['china', 'China'], ['brazil', 'Brazil'], ['israel', 'Israel'],
  ['switzerland', 'Switzerland'], ['denmark', 'Denmark'], ['sweden', 'Sweden'],
  ['norway', 'Norway'], ['finland', 'Finland'], ['kenya', 'Kenya'], ['japan', 'Japan'],
  ['italy', 'Italy'], ['spain', 'Spain'], ['poland', 'Poland'], ['argentina', 'Argentina'],
  ['mexico', 'Mexico'], ['belgium', 'Belgium'], ['south korea', 'South Korea'],
  ['korea', 'South Korea'], ['austria', 'Austria'], ['portugal', 'Portugal'],
  ['south africa', 'South Africa'], ['ethiopia', 'Ethiopia'], ['chile', 'Chile'],
  ['turkey', 'Turkey'], ['pakistan', 'Pakistan'], ['bangladesh', 'Bangladesh'],
  ['vietnam', 'Vietnam'], ['thailand', 'Thailand'], ['egypt', 'Egypt'],
  ['uganda', 'Uganda'], ['tanzania', 'Tanzania'], ['nigeria', 'Nigeria'],
  ['czech', 'Czech Republic'], ['hungary', 'Hungary'], ['romania', 'Romania'],
  ['greece', 'Greece'], ['colombia', 'Colombia'], ['uruguay', 'Uruguay'],
  ['saudi', 'Saudi Arabia'], ['indonesia', 'Indonesia'], ['malaysia', 'Malaysia'],
  ['taiwan', 'Taiwan'], ['sri lanka', 'Sri Lanka'], ['iceland', 'Iceland'],
];

const COMPANY_NAMES = [
  'Lely', 'DeLaval', 'GEA', 'Tetra Pak', 'DSM-Firmenich', 'dsm-firmenich', 'Bovaer',
  'Elanco', 'Zoetis', 'Genus', 'ABS Global', 'CRV', 'Semex', 'Alltech', 'Cargill',
  'ADM', 'Fonterra', 'Arla', 'Danone', 'Nestlé', 'Nestle', 'Lactalis', 'Amul',
  'Afimilk', 'Allflex', 'BouMatic', 'Fullwood', 'SPX Flow', 'Novonesis', 'Chr. Hansen',
  'IFF', 'Kerry', 'Ingredion', 'Perfect Day', 'Remilk', 'Imagindairy', 'Formo',
  'New Culture', 'TurtleTree', 'Bon Vivant', 'Microsoft', 'IBM', 'Trimble',
  'John Deere', 'CNH', 'Valley Irrigation', 'Nedap', 'CowManager', 'smaXtec',
  'Moocall', 'Connecterra', 'Cainthus', 'CattleEye', 'Idena', 'Phileo', 'Provimi',
  'Trouw Nutrition', 'Adisseo', 'Kemin', 'Novus', 'Balchem', 'Phibro', 'Boehringer',
  'Merck Animal Health', 'HIPRA', 'Ceva', 'Vetoquinol', 'Virbac', 'Anand',
  'NDDB', 'Mother Dairy', 'GCMMF', 'Parag', 'Hatsun', 'Heritage Foods',
  'Yili', 'Mengniu', 'Bright Dairy', 'Meiji', 'Morinaga', 'Snow Brand',
  'Saputo', 'Agropur', 'Dairy Farmers of America', 'Land O\'Lakes', 'California Dairies',
  'Valio', 'FrieslandCampina', 'DMK', 'Müller', 'Muller', 'Emmi', 'Sodiaal',
  'Ornua', 'Glanbia', 'Kerry Group', 'Synlait', 'a2 Milk', 'Westland',
  'Murray Goulburn', 'Bega', 'Fonterra Co-operative', 'Open Country',
  'Piracanjuba', 'Itambé', 'Nestlé Purina', 'Fairlife', 'Chobani', 'Dannon',
  'Sargento', 'Tillamook', 'Cabot', 'Organic Valley', 'Horizon Organic',
];

const SEARCH_QUERIES = [
  'dairy cattle mastitis',
  'dairy cow nutrition rumen',
  'dairy cattle genomic selection',
  'automatic milking robot dairy',
  'dairy cattle machine learning',
  'raw milk food safety pathogen',
  'precision fermentation casein dairy',
  'dairy cattle methane emission',
  'dairy farm IoT sensor',
  'cheese whey membrane processing',
  'dairy pasture grazing management',
  'dairy cow welfare heat stress',
  'Holstein lactation milk yield',
  'calf health dairy cattle',
  'A2 beta-casein milk',
  'dairy traceability blockchain',
  'somatic cell count dairy',
  '3-NOP Bovaer dairy methane',
  'lactose-free dairy processing',
  'lameness detection dairy cattle',
];

function isDairyRelevant(title: string, summary: string): boolean {
  const text = `${title} ${summary}`;
  if (NOT_DAIRY_RE.test(text)) return false;
  return DAIRY_RE.test(text);
}

function isPlausibleDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (date < '2024-01-01') return false;
  const today = new Date().toISOString().slice(0, 10);
  return date <= today;
}

function classifyFunction(text: string): FunctionCategory {
  const lower = text.toLowerCase();
  let bestMatch: FunctionCategory = 'Farm Management';
  let bestScore = 0;
  for (const [fn, keywords] of Object.entries(FUNCTION_KEYWORDS)) {
    const score = keywords.filter((k) => lower.includes(k.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = fn as FunctionCategory;
    }
  }
  return bestMatch;
}

function inferRegion(text: string, countryCode?: string): string {
  if (countryCode && COUNTRY_CODES[countryCode.toUpperCase()]) {
    return COUNTRY_CODES[countryCode.toUpperCase()];
  }
  const lower = text.toLowerCase();
  for (const [keyword, region] of REGION_KEYWORDS) {
    if (lower.includes(keyword)) return region;
  }
  return 'Global';
}

function inferCompany(text: string): string | undefined {
  for (const name of COMPANY_NAMES) {
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(text)) return name.replace('Nestle', 'Nestlé').replace('Muller', 'Müller');
  }
  return undefined;
}

function extractInstitution(affiliation: string): string | undefined {
  if (!affiliation) return undefined;
  return affiliation.split(/[,;]/)[0]?.trim() || undefined;
}

function reconstructAbstract(inv: Record<string, number[]> | undefined): string {
  if (!inv) return '';
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(' ');
}

function slugId(prefix: string, raw: string): string {
  return `${prefix}-${raw.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').slice(0, 80)}`;
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!res.ok) return null;
  return res.json();
}

async function fetchArXiv(query: string, maxResults: number): Promise<Development[]> {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);
    const out: Development[] = [];
    for (const entry of entries) {
      const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim();
      const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim();
      const published = extractTag(entry, 'published')?.slice(0, 10);
      const id = extractTag(entry, 'id');
      const authors = extractAllTags(entry, 'name').join(', ');
      if (!title || !summary || !published || !id) continue;
      if (!isPlausibleDate(published) || !isDairyRelevant(title, summary)) continue;
      const text = `${title} ${summary}`;
      out.push({
        id: `arxiv-${id.split('/').pop()}`,
        title: title.slice(0, 200),
        summary: summary.slice(0, 400),
        date: published,
        sourceUrl: id,
        sourceName: 'arXiv',
        function: classifyFunction(text),
        region: inferRegion(authors),
        institution: authors.split(',')[0]?.trim(),
        company: inferCompany(text),
        rdType: 'Research Paper',
        tags: ['arXiv', 'preprint', 'auto-ingested'],
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchCrossref(query: string, maxResults: number): Promise<Development[]> {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=from-pub-date:2024-01-01&rows=${maxResults}&sort=published&order=desc`;
  try {
    const data = (await fetchJson(url)) as {
      message?: { items?: Record<string, unknown>[] };
    } | null;
    if (!data) return [];
    const items = data.message?.items ?? [];
    const out: Development[] = [];
    for (const item of items) {
      const title = (item.title as string[] | undefined)?.[0];
      const abstract = typeof item.abstract === 'string'
        ? item.abstract.replace(/<[^>]+>/g, '')
        : ((item.subtitle as string[] | undefined)?.[0] ?? '');
      const dateParts = (item.published as { 'date-parts'?: number[][] } | undefined)?.['date-parts']?.[0];
      const published = dateParts
        ? `${dateParts[0]}-${String(dateParts[1] ?? 1).padStart(2, '0')}-${String(dateParts[2] ?? 1).padStart(2, '0')}`
        : undefined;
      const doi = item.DOI as string | undefined;
      const authors = ((item.author as { given?: string; family?: string; affiliation?: { name?: string }[] }[]) ?? [])
        .map((a) => `${a.given ?? ''} ${a.family ?? ''}`.trim())
        .join(', ');
      const affiliation = (item.author as { affiliation?: { name?: string }[] }[] | undefined)?.[0]?.affiliation?.[0]?.name ?? '';
      if (!title || !published || !doi) continue;
      if (!isPlausibleDate(published) || !isDairyRelevant(title, abstract || title)) continue;
      const text = `${title} ${abstract}`;
      out.push({
        id: slugId('crossref', doi),
        title: title.slice(0, 200),
        summary: (abstract || title).slice(0, 400),
        date: published,
        sourceUrl: `https://doi.org/${doi}`,
        sourceName: (item['container-title'] as string[] | undefined)?.[0] ?? 'Crossref',
        function: classifyFunction(text),
        region: inferRegion(`${authors} ${affiliation}`),
        institution: extractInstitution(affiliation),
        company: inferCompany(text),
        rdType: 'Research Paper',
        tags: ['Crossref', 'peer-reviewed', 'auto-ingested'],
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchOpenAlex(query: string, maxResults: number): Promise<Development[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=from_publication_date:2024-01-01,type:article&per-page=${Math.min(maxResults, 50)}&sort=publication_date:desc&mailto=${MAILTO}`;
  try {
    const data = (await fetchJson(url)) as {
      results?: {
        id: string;
        doi?: string;
        title?: string;
        display_name?: string;
        publication_date?: string;
        abstract_inverted_index?: Record<string, number[]>;
        authorships?: {
          institutions?: { display_name?: string; country_code?: string }[];
        }[];
        primary_location?: { source?: { display_name?: string } };
      }[];
    } | null;
    if (!data) return [];
    const out: Development[] = [];
    for (const work of data.results ?? []) {
      const title = work.display_name || work.title;
      const summary = reconstructAbstract(work.abstract_inverted_index);
      const published = work.publication_date;
      if (!title || !published) continue;
      if (!isPlausibleDate(published) || !isDairyRelevant(title, summary || title)) continue;
      const inst = work.authorships?.[0]?.institutions?.[0];
      const doi = work.doi?.replace('https://doi.org/', '');
      const text = `${title} ${summary}`;
      out.push({
        id: slugId('openalex', doi || work.id.split('/').pop() || title),
        title: title.slice(0, 200),
        summary: (summary || title).slice(0, 400),
        date: published,
        sourceUrl: doi ? `https://doi.org/${doi}` : work.id.replace('https://openalex.org/', 'https://openalex.org/'),
        sourceName: work.primary_location?.source?.display_name ?? 'OpenAlex',
        function: classifyFunction(text),
        region: inferRegion(`${inst?.display_name ?? ''} ${title}`, inst?.country_code),
        institution: inst?.display_name,
        company: inferCompany(text),
        rdType: 'Research Paper',
        tags: ['OpenAlex', 'peer-reviewed', 'auto-ingested'],
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function fetchEuropePmc(query: string, maxResults: number): Promise<Development[]> {
  const q = `${query} AND (FIRST_PDATE:[2024-01-01 TO 2026-12-31])`;
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&pageSize=${maxResults}&resultType=core`;
  try {
    const data = (await fetchJson(url)) as {
      resultList?: {
        result?: {
          title?: string;
          abstractText?: string;
          doi?: string;
          journalTitle?: string;
          firstPublicationDate?: string;
          authorString?: string;
          affiliation?: string;
          pmid?: string;
        }[];
      };
    } | null;
    if (!data) return [];
    const out: Development[] = [];
    for (const item of data.resultList?.result ?? []) {
      const title = item.title;
      const summary = item.abstractText ?? '';
      const published = item.firstPublicationDate;
      if (!title || !published) continue;
      if (!isPlausibleDate(published.slice(0, 10)) || !isDairyRelevant(title, summary || title)) continue;
      const text = `${title} ${summary}`;
      const idRaw = item.doi || item.pmid || title;
      out.push({
        id: slugId('epmc', idRaw),
        title: title.slice(0, 200),
        summary: (summary || title).slice(0, 400),
        date: published.slice(0, 10),
        sourceUrl: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/MED/${item.pmid}`,
        sourceName: item.journalTitle ?? 'Europe PMC',
        function: classifyFunction(text),
        region: inferRegion(`${item.authorString ?? ''} ${item.affiliation ?? ''}`),
        institution: extractInstitution(item.affiliation ?? ''),
        company: inferCompany(text),
        rdType: 'Academic Study',
        tags: ['Europe PMC', 'PubMed', 'auto-ingested'],
      });
    }
    return out;
  } catch {
    return [];
  }
}

function extractTag(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1];
}

function extractAllTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) results.push(match[1].trim());
  return results;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeUnique(existing: Development[], incoming: Development[]): { merged: Development[]; added: number } {
  const ids = new Set(existing.map((d) => d.id));
  const titles = new Set(existing.map((d) => d.title.toLowerCase().replace(/\s+/g, ' ')));
  let added = 0;
  const extra: Development[] = [];
  for (const item of incoming) {
    const t = item.title.toLowerCase().replace(/\s+/g, ' ');
    if (ids.has(item.id) || titles.has(t)) continue;
    ids.add(item.id);
    titles.add(t);
    extra.push(item);
    added++;
  }
  return { merged: [...extra, ...existing], added };
}

async function harvest(mode: 'daily' | 'bulk'): Promise<Development[]> {
  const perQuery = mode === 'bulk' ? 25 : 8;
  const queries = mode === 'bulk' ? SEARCH_QUERIES : SEARCH_QUERIES.slice(0, 6);
  const collected: Development[] = [];

  const runners: { name: string; fn: (q: string, n: number) => Promise<Development[]> }[] = [
    { name: 'OpenAlex', fn: fetchOpenAlex },
    { name: 'Europe PMC', fn: fetchEuropePmc },
    { name: 'Crossref', fn: fetchCrossref },
    { name: 'arXiv', fn: fetchArXiv },
  ];

  for (const source of runners) {
    for (const query of queries) {
      console.log(`Fetching ${source.name}: ${query}`);
      const items = await source.fn(query, perQuery);
      console.log(`  → ${items.length} dairy-relevant items`);
      collected.push(...items);
      await sleep(source.name === 'Crossref' ? 1100 : 400);
    }
  }

  return collected;
}

async function main() {
  console.log('Starting ingestion...');

  let existing: DevelopmentsData = {
    metadata: {
      lastRefreshed: new Date().toISOString().slice(0, 10),
      nextRefresh: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      totalTracked: 0,
      coverageStart: '2024-01-01',
    },
    developments: [],
  };

  if (fs.existsSync(DATA_PATH)) {
    existing = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  }

  let working = existing.developments.filter(
    (d) => isPlausibleDate(d.date) && isDairyRelevant(d.title, d.summary)
  );
  console.log(`Kept ${working.length}/${existing.developments.length} after date + dairy filters`);
  const curated = mergeUnique(working, CURATED_INDUSTRY);
  working = curated.merged;
  console.log(`Merged curated industry catalog: +${curated.added}`);

  const forceBulk = process.argv.includes('--bulk');
  const mode: 'daily' | 'bulk' = forceBulk || working.length < 220 ? 'bulk' : 'daily';
  console.log(`Mode: ${mode}`);

  const harvested = await harvest(mode);
  const api = mergeUnique(working, harvested);
  working = api.merged;
  console.log(`Merged API harvest: +${api.added}`);

  const merged = working.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const updated: DevelopmentsData = {
    metadata: {
      lastRefreshed: new Date().toISOString().slice(0, 10),
      nextRefresh: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      totalTracked: merged.length,
      coverageStart: existing.metadata.coverageStart || '2024-01-01',
    },
    developments: merged,
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
  console.log(`Ingestion complete. Total: ${merged.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
