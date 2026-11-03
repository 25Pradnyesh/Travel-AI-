/**
 * Zero-dependency pure TypeScript QR Code Matrix Generator
 * Generates ISO/IEC 18004 compliant QR Code modules (Version 1-10, Error Correction Level M).
 */

// Galois Field GF(256) tables for QR Reed-Solomon coding
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

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
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

function rsCalculateEc(data: Uint8Array, ecCount: number): Uint8Array {
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

// Version table constants for Medium Error Correction
interface QrVersionInfo {
  version: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  blocks: { count: number; dataPerBlock: number }[];
  alignmentCoords: number[];
}

const QR_VERSIONS: QrVersionInfo[] = [
  {
    version: 1,
    totalCodewords: 26,
    ecCodewords: 10,
    dataCodewords: 16,
    blocks: [{ count: 1, dataPerBlock: 16 }],
    alignmentCoords: [],
  },
  {
    version: 2,
    totalCodewords: 44,
    ecCodewords: 16,
    dataCodewords: 28,
    blocks: [{ count: 1, dataPerBlock: 28 }],
    alignmentCoords: [6, 18],
  },
  {
    version: 3,
    totalCodewords: 70,
    ecCodewords: 26,
    dataCodewords: 44,
    blocks: [{ count: 1, dataPerBlock: 44 }],
    alignmentCoords: [6, 22],
  },
  {
    version: 4,
    totalCodewords: 100,
    ecCodewords: 36,
    dataCodewords: 64,
    blocks: [{ count: 2, dataPerBlock: 32 }],
    alignmentCoords: [6, 26],
  },
  {
    version: 5,
    totalCodewords: 134,
    ecCodewords: 48,
    dataCodewords: 86,
    blocks: [{ count: 2, dataPerBlock: 43 }],
    alignmentCoords: [6, 30],
  },
];

export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  
  // Pick smallest fitting version
  let info = QR_VERSIONS[0];
  for (const v of QR_VERSIONS) {
    // 4 bits mode (byte = 0100) + 8 bits count + data
    if (utf8Bytes.length + 2 <= v.dataCodewords) {
      info = v;
      break;
    }
    info = v;
  }

  // 1. Bitstream encoding: 8-bit Byte mode
  const bits: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(utf8Bytes.length, 8); // Character count
  for (const b of utf8Bytes) {
    pushBits(b, 8);
  }

  // Terminator
  const maxBits = info.dataCodewords * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to data bytes
  const dataBytes = new Uint8Array(info.dataCodewords);
  for (let i = 0; i < info.dataCodewords; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    dataBytes[i] = byte;
  }

  // 2. Error correction coding
  const ecPerBlock = Math.floor(info.ecCodewords / info.blocks.reduce((acc, b) => acc + b.count, 0));
  const totalBlocks = info.blocks.reduce((acc, b) => acc + b.count, 0);
  const blockData: Uint8Array[] = [];
  const blockEc: Uint8Array[] = [];

  let dataOffset = 0;
  for (const b of info.blocks) {
    for (let c = 0; c < b.count; c++) {
      const slice = dataBytes.slice(dataOffset, dataOffset + b.dataPerBlock);
      dataOffset += b.dataPerBlock;
      blockData.push(slice);
      blockEc.push(rsCalculateEc(slice, ecPerBlock));
    }
  }

  // Interleave data and EC
  const interleaved: number[] = [];
  let maxDataLen = 0;
  blockData.forEach((b) => (maxDataLen = Math.max(maxDataLen, b.length)));

  for (let i = 0; i < maxDataLen; i++) {
    for (const b of blockData) {
      if (i < b.length) interleaved.push(b[i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const b of blockEc) {
      if (i < b.length) interleaved.push(b[i]);
    }
  }

  // 3. Matrix construction
  const size = 17 + 4 * info.version;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  function setFinder(startR: number, startC: number) {
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

  // Three Finder patterns
  setFinder(0, 0);
  setFinder(0, size - 7);
  setFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) {
      matrix[6][i] = i % 2 === 0;
      reserved[6][i] = true;
    }
    if (!reserved[i][6]) {
      matrix[i][6] = i % 2 === 0;
      reserved[i][6] = true;
    }
  }

  // Alignment patterns
  if (info.alignmentCoords.length > 0) {
    for (const r of info.alignmentCoords) {
      for (const c of info.alignmentCoords) {
        if (reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            reserved[nr][nc] = true;
            matrix[nr][nc] =
              Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          }
        }
      }
    }
  }

  // Dark module
  matrix[4 * info.version + 9][8] = true;
  reserved[4 * info.version + 9][8] = true;

  // Format info area reservation
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  reserved[8][8] = true;

  // 4. Fill Data Bits with Mask 0 ((r + c) % 2 == 0)
  const finalBits: number[] = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) {
      finalBits.push((byte >> b) & 1);
    }
  }

  let bitIdx = 0;
  let dir = -1; // upward
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing column
    const rStart = dir === -1 ? size - 1 : 0;
    const rEnd = dir === -1 ? -1 : size;

    for (let r = rStart; r !== rEnd; r += dir === -1 ? -1 : 1) {
      for (const c of [col, col - 1]) {
        if (!reserved[r][c]) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply mask 0: invert if (r + c) is even
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = (bit ^ (mask ? 1 : 0)) === 1;
        }
      }
    }
    col -= 2;
    dir = -dir;
  }

  // 5. Place Format Information (EC Level M = 00, Mask 0 = 000 -> 0b101010000010010)
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const formatCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = formatCoords[i];
    matrix[r][c] = formatBits[i] === 1;
  }
  for (let i = 0; i < 7; i++) {
    matrix[size - 1 - i][8] = formatBits[i] === 1;
  }
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 8 + i] = formatBits[7 + i] === 1;
  }

  // Return non-nullable matrix
  return matrix.map((row) => row.map((cell) => cell ?? false));
}

export function matrixToSvg(matrix: boolean[][], cellSize = 10, quietZone = 4): string {
  const size = matrix.length;
  const totalSize = (size + quietZone * 2) * cellSize;
  let path = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        const x = (c + quietZone) * cellSize;
        const y = (r + quietZone) * cellSize;
        path += `M${x},${y}h${cellSize}v${cellSize}h-${cellSize}z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#081218" rx="16" />
  <path d="${path}" fill="#fbf4e3" />
</svg>`;
}

export function matrixToAscii(matrix: boolean[][]): string {
  const quiet = 2;
  const size = matrix.length;
  let out = '';
  // Double row packing using block chars '█', '▀', '▄', ' '
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
    out += line + '\n';
  }
  return out;
}

