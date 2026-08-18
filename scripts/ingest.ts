/**
 * Daily / bulk ingestion — arXiv, Crossref, OpenAlex, Europe PMC, dairy trade-press RSS
 * (DairyNews.today, eDairyNews, Dairy Business, and others)
 * Run: npm run ingest              (daily: APIs + RSS + DairyNews.today new items)
 *      npm run ingest -- --bulk    (deeper API harvest + full DairyNews.today archive)
 *      npm run ingest -- --dairynews --rss   (DairyNews.today 2024+ archive only)
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
import { RECENT_TRADE_PRESS } from './recent-trade-press';

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

const DEDICATED_DAIRY_SOURCES = new Set(['DairyNews.today']);
const DAIRYNEWS_SITEMAP = 'https://dairynews.today/sitemap-iblock-91.xml';
const DAIRYNEWS_LISTING = 'https://dairynews.today/news/';

function keepCatalogItem(d: Development): boolean {
  if (!isPlausibleDate(d.date)) return false;
  const text = `${d.title} ${d.summary}`;
  if (DEDICATED_DAIRY_SOURCES.has(d.sourceName)) {
    return !NOT_DAIRY_RE.test(text);
  }
  return isDairyRelevant(d.title, d.summary);
}

function toIsoDate(ddmmyyyy: string): string | undefined {
  const m = ddmmyyyy.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return undefined;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function dairyNewsRegion(listed: string, text: string): string {
  const inferred = inferRegion(`${listed} ${text}`);
  if (inferred !== 'Global') return inferred;
  const cleaned = listed.replace(/\s+/g, ' ').trim();
  if (!cleaned || /^world$/i.test(cleaned)) return 'Global';
  return cleaned;
}

function dairyNewsItem(opts: {
  url: string;
  title: string;
  summary: string;
  date: string;
  regionListed?: string;
}): Development | null {
  const title = opts.title.replace(/\s+/g, ' ').trim();
  const summary = (opts.summary || title).replace(/\s+/g, ' ').trim();
  if (!title || !opts.url || !isPlausibleDate(opts.date)) return null;
  if (NOT_DAIRY_RE.test(`${title} ${summary}`)) return null;
  const text = `${title} ${summary}`;
  const link = opts.url.startsWith('http') ? opts.url : `https://dairynews.today${opts.url}`;
  return {
    id: slugId('rss', `DairyNews.today-${link}`),
    title: title.slice(0, 200),
    summary: summary.slice(0, 400),
    date: opts.date,
    sourceUrl: link,
    sourceName: 'DairyNews.today',
    function: classifyFunction(text),
    region: dairyNewsRegion(opts.regionListed ?? '', text),
    company: inferCompany(text),
    rdType: 'Industry News',
    tags: ['RSS', 'DairyNews.today', 'auto-ingested'],
  };
}

function parseDairyNewsListing(html: string): Development[] {
  const chunks = html.split(/news-list-item-height-2x/);
  const out: Development[] = [];
  for (const chunk of chunks.slice(1)) {
    const href =
      chunk.match(/class="title h-4"[^>]*href="([^"]+)"/i)?.[1] ||
      chunk.match(/href="(\/news\/[^"?#]+\.html)"/i)?.[1];
    const title = decodeXml(chunk.match(/class="title h-4"[^>]*>\s*([\s\S]*?)<\/a>/i)?.[1] || '');
    const regionListed = decodeXml(chunk.match(/<span class="region">\s*([\s\S]*?)<\/span>/i)?.[1] || '');
    const date = toIsoDate(decodeXml(chunk.match(/<span class="data">\s*([\s\S]*?)<\/span>/i)?.[1] || ''));
    if (!href || !title || !date) continue;
    const item = dairyNewsItem({ url: href, title, summary: title, date, regionListed });
    if (item) out.push(item);
  }
  return out;
}

function parseDairyNewsArticle(html: string, url: string): Development | null {
  const title = decodeXml(
    html.match(/<h1[^>]*news-element-title[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
      html.match(/data-title="([^"]+)"/i)?.[1] ||
      '',
  );
  const regionListed = decodeXml(html.match(/<span class="region">\s*([\s\S]*?)<\/span>/i)?.[1] || '');
  const date = toIsoDate(decodeXml(html.match(/<span class="data">\s*([\s\S]*?)<\/span>/i)?.[1] || ''));
  const summary = decodeXml(html.match(/class="preview-text">([\s\S]*?)<\/div>/i)?.[1] || title);
  if (!title || !date) return null;
  return dairyNewsItem({ url, title, summary, date, regionListed });
}

async function fetchHtml(url: string, attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/rss+xml,application/xml' },
        signal: AbortSignal.timeout(20000),
      });
      if (res.status === 503 || res.status === 429 || res.status === 502) {
        await sleep(600 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      return await res.text();
    } catch {
      await sleep(400 * (i + 1));
    }
  }
  return null;
}

function titleFromDairyNewsUrl(url: string): string {
  const slug = decodeURIComponent(url.split('/').pop() || '')
    .replace(/\.html$/i, '')
    .replace(/_\d+$/, '');
  const words = slug.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!words) return '';
  return words.replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

async function fetchDairyNewsListingPages(maxPages: number): Promise<Development[]> {
  const collected: Development[] = [];
  const seen = new Set<string>();
  let prevSignature = '';
  let stalled = 0;
  for (let page = 1; page <= maxPages; page++) {
    const url = page === 1 ? DAIRYNEWS_LISTING : `${DAIRYNEWS_LISTING}?PAGEN_1=${page}`;
    const html = await fetchHtml(url);
    if (!html) {
      stalled++;
      if (stalled >= 3) break;
      await sleep(400);
      continue;
    }
    const items = parseDairyNewsListing(html);
    const signature = items[0] ? `${items[0].sourceUrl}|${items[0].date}` : '';
    if (signature && signature === prevSignature) {
      stalled++;
      if (stalled >= 2) {
        console.log(`  DairyNews.today listing pagination capped at page ${page}`);
        break;
      }
    } else {
      stalled = 0;
      prevSignature = signature;
    }
    let added = 0;
    for (const item of items) {
      if (seen.has(item.sourceUrl)) continue;
      seen.add(item.sourceUrl);
      collected.push(item);
      added++;
    }
    const oldest = items.reduce((min, item) => (item.date < min ? item.date : min), '9999-99-99');
    console.log(`  DairyNews.today listing p${page} → ${added} new (oldest ${oldest === '9999-99-99' ? 'n/a' : oldest})`);
    if (items.length > 0 && items.every((item) => item.date < '2024-01-01')) break;
    await sleep(250);
  }
  return collected;
}

async function loadDairyNewsSitemapUrls(): Promise<{ loc: string; lastmod: string }[]> {
  try {
    const res = await fetch(DAIRYNEWS_SITEMAP, { headers: { 'User-Agent': UA, Accept: 'application/xml, text/xml' } });
    if (!res.ok) return [];
    const xml = await res.text();
    const urls: { loc: string; lastmod: string }[] = [];
    const blocks = xml.split(/<url>/i).slice(1);
    for (const block of blocks) {
      const loc = extractTag(block, 'loc')?.trim();
      const lastmod = (extractTag(block, 'lastmod') || '').slice(0, 10);
      if (!loc || !/^https:\/\/dairynews\.today\/news\/[^/?#]+\.html$/i.test(loc)) continue;
      urls.push({ loc, lastmod });
    }
    return urls;
  } catch {
    return [];
  }
}

async function fetchDairyNewsSitemapArchive(skipUrls: Set<string>): Promise<Development[]> {
  const sitemap = await loadDairyNewsSitemapUrls();
  const collected: Development[] = [];
  let skipped = 0;
  for (const row of sitemap) {
    if (skipUrls.has(row.loc)) {
      skipped++;
      continue;
    }
    if (!row.lastmod || !isPlausibleDate(row.lastmod)) continue;
    const title = titleFromDairyNewsUrl(row.loc);
    const item = dairyNewsItem({
      url: row.loc,
      title,
      summary: title,
      date: row.lastmod,
      regionListed: 'Global',
    });
    if (item) collected.push(item);
  }
  console.log(`  DairyNews.today sitemap: ${sitemap.length} urls, skipped ${skipped} existing, +${collected.length} archive items`);
  return collected;
}

function mergeUnique(existing: Development[], incoming: Development[]): { merged: Development[]; added: number } {
  const ids = new Map(existing.map((d) => [d.id, d]));
  const titles = new Map(existing.map((d) => [d.title.toLowerCase().replace(/\s+/g, ' '), d]));
  let added = 0;
  const extra: Development[] = [];
  for (const item of incoming) {
    const t = item.title.toLowerCase().replace(/\s+/g, ' ');
    const prev = ids.get(item.id) || titles.get(t);
    if (prev) {
      const incomingRicher =
        item.summary.length > prev.summary.length ||
        (item.summary !== item.title && prev.summary === prev.title);
      if (incomingRicher) {
        prev.title = item.title;
        prev.summary = item.summary;
        prev.date = item.date;
        prev.function = item.function;
        if (item.region && (prev.region === 'Global' || !prev.region)) prev.region = item.region;
        if (item.company && !prev.company) prev.company = item.company;
      }
      continue;
    }
    ids.set(item.id, item);
    titles.set(t, item);
    extra.push(item);
    added++;
  }
  return { merged: [...extra, ...existing], added };
}

type RssFeed = { name: string; url: string; region: string; alwaysDairy?: boolean };

const RSS_FEEDS: RssFeed[] = [
  { name: 'DairyNews.today', url: 'https://dairynews.today/rss/', region: 'Global', alwaysDairy: true },
  { name: 'eDairyNews', url: 'https://en.edairynews.com/feed', region: 'Global' },
  { name: 'Dairy Business', url: 'https://dairybusiness.com/feed/', region: 'USA' },
  { name: 'The Cattle Site', url: 'https://www.thecattlesite.com/news/rss/', region: 'Global' },
  { name: 'ScienceDaily Agriculture', url: 'https://www.sciencedaily.com/rss/plants_animals/agriculture_and_food.xml', region: 'Global' },
  { name: 'MDPI Animals', url: 'https://www.mdpi.com/rss/journal/animals', region: 'Global' },
];

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function rssDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

async function fetchRssFeed(feed: RssFeed): Promise<Development[]> {
  try {
    const xml = await fetchHtml(feed.url);
    if (!xml) return [];
    const chunks = xml.split(/<item[\s>]/i).slice(1);
    const entries = chunks.length ? chunks : xml.split(/<entry[\s>]/i).slice(1);
    const out: Development[] = [];
    for (const chunk of entries) {
      const title = decodeXml(extractTag(chunk, 'title') || '');
      const summary = decodeXml(extractTag(chunk, 'description') || extractTag(chunk, 'summary') || extractTag(chunk, 'content') || title);
      const link = decodeXml(
        extractTag(chunk, 'link') ||
          chunk.match(/<link[^>]+href="([^"]+)"/i)?.[1] ||
          '',
      );
      const published = rssDate(extractTag(chunk, 'pubDate') || extractTag(chunk, 'published') || extractTag(chunk, 'updated'));
      if (!title || !link || !published) continue;
      if (!isPlausibleDate(published)) continue;
      // Dedicated dairy outlets (e.g. DairyNews.today) are already in-sector; still drop infant/human-milk hits.
      if (feed.alwaysDairy) {
        if (NOT_DAIRY_RE.test(`${title} ${summary}`)) continue;
      } else if (!isDairyRelevant(title, summary || title)) {
        continue;
      }
      const text = `${title} ${summary}`;
      out.push({
        id: slugId('rss', `${feed.name}-${link}`),
        title: title.slice(0, 200),
        summary: (summary || title).slice(0, 400),
        date: published,
        sourceUrl: link.startsWith('http') ? link : `https://${link}`,
        sourceName: feed.name,
        function: classifyFunction(text),
        region: inferRegion(text, undefined) === 'Global' ? feed.region : inferRegion(text),
        company: inferCompany(text),
        rdType: feed.name.includes('MDPI') || feed.name.includes('Journal') ? 'Research Paper' : 'Industry News',
        tags: ['RSS', feed.name, 'auto-ingested'],
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function harvest(mode: 'daily' | 'bulk'): Promise<Development[]> {
  const perQuery = mode === 'bulk' ? 25 : 8;
  const queries = mode === 'bulk' ? SEARCH_QUERIES : SEARCH_QUERIES.slice(0, 6);
  const collected: Development[] = [];

  console.log('Fetching dairy trade-press RSS…');
  for (const feed of RSS_FEEDS) {
    const items = await fetchRssFeed(feed);
    console.log(`  ${feed.name} → ${items.length} dairy-relevant items`);
    collected.push(...items);
    await sleep(300);
  }

  // Daily: a few pages catch items RSS may miss. Bulk walks until Bitrix caps pagination (~Sep 2025).
  const listingPages = mode === 'bulk' ? 110 : 5;
  console.log(`Fetching DairyNews.today listing (up to ${listingPages} pages)…`);
  const listing = await fetchDairyNewsListingPages(listingPages);
  console.log(`  DairyNews.today listing total → ${listing.length}`);
  collected.push(...listing);

  const runners: { name: string; fn: (q: string, n: number) => Promise<Development[]> }[] = [
    { name: 'OpenAlex', fn: fetchOpenAlex },
    { name: 'Europe PMC', fn: fetchEuropePmc },
    { name: 'Crossref', fn: fetchCrossref },
    { name: 'arXiv', fn: fetchArXiv },
  ];

  const skipApis = process.argv.includes('--rss');
  if (!skipApis) {
    for (const source of runners) {
      for (const query of queries) {
        console.log(`Fetching ${source.name}: ${query}`);
        const items = await source.fn(query, perQuery);
        console.log(`  → ${items.length} dairy-relevant items`);
        collected.push(...items);
        await sleep(source.name === 'Crossref' ? 1100 : 400);
      }
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

  let working = existing.developments.filter(keepCatalogItem);
  console.log(`Kept ${working.length}/${existing.developments.length} after date + dairy filters`);
  const curated = mergeUnique(working, CURATED_INDUSTRY);
  working = curated.merged;
  console.log(`Merged curated industry catalog: +${curated.added}`);
  const recent = mergeUnique(working, RECENT_TRADE_PRESS);
  working = recent.merged;
  console.log(`Merged recent trade press: +${recent.added}`);

  const forceBulk = process.argv.includes('--bulk');
  const forceDairyNews = process.argv.includes('--dairynews');
  const mode: 'daily' | 'bulk' = forceBulk || forceDairyNews || working.length < 220 ? 'bulk' : 'daily';
  console.log(`Mode: ${mode}`);

  const persist = (developments: Development[]) => {
    const sorted = [...developments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const updated: DevelopmentsData = {
      metadata: {
        lastRefreshed: new Date().toISOString().slice(0, 10),
        nextRefresh: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        totalTracked: sorted.length,
        coverageStart: existing.metadata.coverageStart || '2024-01-01',
      },
      developments: sorted,
    };
    fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
    return sorted;
  };

  const harvested = await harvest(mode);
  const api = mergeUnique(working, harvested);
  working = persist(api.merged);
  console.log(`Merged API/RSS harvest: +${api.added} (catalog ${working.length})`);

  const dairyNewsCount = working.filter((d) => d.sourceName === 'DairyNews.today').length;
  const skip = new Set(working.map((d) => d.sourceUrl));
  console.log(`DairyNews.today in catalog: ${dairyNewsCount}; loading sitemap archive`);
  const archive = await fetchDairyNewsSitemapArchive(skip);
  const mergedArchive = mergeUnique(working, archive);
  working = mergedArchive.merged;
  console.log(`Merged DairyNews.today sitemap archive: +${mergedArchive.added}`);

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const toEnrich = working
    .filter(
      (d) =>
        d.sourceName === 'DairyNews.today' &&
        d.date >= weekAgo &&
        d.summary.replace(/\s+/g, ' ') === d.title.replace(/\s+/g, ' '),
    )
    .slice(0, 40);
  if (toEnrich.length) {
    console.log(`Enriching ${toEnrich.length} recent DairyNews.today items from article pages…`);
    for (const row of toEnrich) {
      const html = await fetchHtml(row.sourceUrl, 2);
      const parsed = html ? parseDairyNewsArticle(html, row.sourceUrl) : null;
      if (parsed) {
        row.summary = parsed.summary;
        if (parsed.region !== 'Global') row.region = parsed.region;
        if (parsed.company && !row.company) row.company = parsed.company;
        if (parsed.date) row.date = parsed.date;
        row.function = parsed.function;
      }
      await sleep(200);
    }
  }

  const merged = persist(working);
  console.log(`Ingestion complete. Total: ${merged.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
