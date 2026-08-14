/**
 * Builds public/dairy-rd-extension.zip with a single top-level folder:
 *   dairy-rd-extension/manifest.json
 *   dairy-rd-extension/background.js
 *   ...
 * Chrome Load unpacked needs that folder, not a zip of loose files.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'extension');
const OUT = path.join(ROOT, 'public', 'dairy-rd-extension.zip');
const FOLDER = 'dairy-rd-extension';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function collectFiles(dir, prefix = '') {
  const files = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === 'README.md') continue;
    const full = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const st = fs.statSync(full);
    if (st.isDirectory()) files.push(...collectFiles(full, rel));
    else files.push({ name: rel.replace(/\\/g, '/'), data: fs.readFileSync(full) });
  }
  return files;
}

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n, 0);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function makeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const file of entries) {
    const name = Buffer.from(`${FOLDER}/${file.name}`, 'utf8');
    const compressed = zlib.deflateRawSync(file.data);
    const crc = crc32(file.data);
    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      name,
      compressed,
    ]);
    const central = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(8),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(file.data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(localHeader);
    centrals.push(central);
    offset += localHeader.length;
  }

  const centralDir = Buffer.concat(centrals);
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);

  return Buffer.concat([...locals, centralDir, end]);
}

const files = collectFiles(SRC);
if (!files.some((f) => f.name === 'manifest.json')) {
  throw new Error('extension/manifest.json is missing — cannot pack');
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, makeZip(files));

console.log(`Wrote ${path.relative(ROOT, OUT)} (${files.length} files)`);
for (const f of files) console.log(`  ${FOLDER}/${f.name}`);
