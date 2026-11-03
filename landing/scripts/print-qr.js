#!/usr/bin/env node
/**
 * CLI utility to print an ASCII QR Code in the terminal and write an SVG for the deployed URL.
 * Usage:
 *   node scripts/print-qr.js [URL]
 * Default URL: process.env.NEXT_PUBLIC_APP_URL || 'https://vamo.travel'
 */

const fs = require('fs');
const path = require('path');

const targetUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'https://vamo.travel';

console.log('\n======================================================');
console.log('  VAMO — QR Code Generator');
console.log(`  Target URL: ${targetUrl}`);
console.log('======================================================\n');

// Standard minimal QR encoder for Node.js
// Galois Field GF(256) tables
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(function initGaloisField() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = val;
    GF_LOG[val] = i;
    val = (val << 1) ^ (val & 128 ? 0x11d : 0);
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(x, y) {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], factor);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsCalculateEc(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const remainder = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return remainder;
}

const QR_VERSIONS = [
  { version: 1, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, blocks: [{ count: 1, dataPerBlock: 16 }], alignmentCoords: [] },
  { version: 2, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, blocks: [{ count: 1, dataPerBlock: 28 }], alignmentCoords: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, blocks: [{ count: 1, dataPerBlock: 44 }], alignmentCoords: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, blocks: [{ count: 2, dataPerBlock: 32 }], alignmentCoords: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewords: 48, dataCodewords: 86, blocks: [{ count: 2, dataPerBlock: 43 }], alignmentCoords: [6, 30] },
];

function generateQrMatrix(text) {
  const utf8Bytes = Buffer.from(text, 'utf8');
  let info = QR_VERSIONS[0];
  for (const v of QR_VERSIONS) {
    if (utf8Bytes.length + 2 <= v.dataCodewords) {
      info = v;
      break;
    }
    info = v;
  }

  const bits = [];
  function pushBits(val, length) {
    for (let i = length - 1; i >= 0; i--) bits.push((val >> i) & 1);
  }

  pushBits(0b0100, 4);
  pushBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) pushBits(b, 8);

  const maxBits = info.dataCodewords * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  const dataBytes = new Uint8Array(info.dataCodewords);
  for (let i = 0; i < info.dataCodewords; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i * 8 + j];
    dataBytes[i] = byte;
  }

  const ecPerBlock = Math.floor(info.ecCodewords / info.blocks.reduce((acc, b) => acc + b.count, 0));
  const blockData = [];
  const blockEc = [];
  let dataOffset = 0;
  for (const b of info.blocks) {
    for (let c = 0; c < b.count; c++) {
      const slice = dataBytes.slice(dataOffset, dataOffset + b.dataPerBlock);
      dataOffset += b.dataPerBlock;
      blockData.push(slice);
      blockEc.push(rsCalculateEc(slice, ecPerBlock));
    }
  }

  const interleaved = [];
  let maxDataLen = 0;
  blockData.forEach((b) => (maxDataLen = Math.max(maxDataLen, b.length)));
  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blockData) if (i < b.length) interleaved.push(b[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of blockEc) if (i < b.length) interleaved.push(b[i]);
  }

  const size = 17 + 4 * info.version;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinder(startR, startC) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = startR + r;
        const nc = startC + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          reserved[nr][nc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[nr][nc] = isBorder || isCenter;
          } else {
            matrix[nr][nc] = false;
          }
        }
      }
    }
  }

  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0; reserved[6][i] = true; }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0; reserved[i][6] = true; }
  }

  if (info.alignmentCoords.length > 0) {
    for (const r of info.alignmentCoords) {
      for (const c of info.alignmentCoords) {
        if (reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            reserved[nr][nc] = true;
            matrix[nr][nc] = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          }
        }
      }
    }
  }

  matrix[4 * info.version + 9][8] = true;
  reserved[4 * info.version + 9][8] = true;

  for (let i = 0; i <= 8; i++) { if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; } }
  for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  reserved[8][8] = true;

  const finalBits = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) finalBits.push((byte >> b) & 1);
  }

  let bitIdx = 0;
  let dir = -1;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--;
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;
    for (let r = rStart; r !== rEnd; r += dir === -1 ? -1 : 1) {
      for (const c of [col, col - 1]) {
        if (!reserved[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    col -= 2;
    dir = -dir;
  }

  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords[i];
    matrix[r][c] = formatBits[i] === 1;
  }
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = formatBits[i] === 1;
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = formatBits[7 + i] === 1;

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

const matrix = generateQrMatrix(targetUrl);

// Print ASCII to console
const quiet = 2;
const size = matrix.length;
for (let r = -quiet; r < size + quiet; r += 2) {
  let line = '';
  for (let c = -quiet; c < size + quiet; c++) {
    const top = r >= 0 && r < size && c >= 0 && c < size ? matrix[r][c] : false;
    const bot = r + 1 >= 0 && r + 1 < size && c >= 0 && c < size ? matrix[r + 1][c] : false;
    if (top && bot) line += '█';
    else if (top && !bot) line += '▀';
    else if (!top && bot) line += '▄';
    else line += ' ';
  }
  console.log(line);
}

// Write SVG to disk
const cellSize = 10;
const totalSize = (size + 8) * cellSize;
let pathData = '';
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (matrix[r][c]) {
      const x = (c + 4) * cellSize;
      const y = (r + 4) * cellSize;
      pathData += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
    }
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#081218" rx="16" />
  <path d="${pathData}" fill="#fbf4e3" />
</svg>`;

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'qr.svg');
fs.writeFileSync(outPath, svg, 'utf8');

console.log(`\n? Saved vector QR code to: ${outPath}`);
console.log('  Scan with phone camera or view at /qr');

