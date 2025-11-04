// Adapted from "qrcode-generator" by Kazuhiko Arase (MIT License)
// The original project: https://github.com/kazuhikoarase/qrcode-generator
// This trimmed implementation keeps only what we need to build QR matrices in-browser.

export type QrMatrix = boolean[][];

type QrErrorCorrectionLevel = "L" | "M" | "Q" | "H";

type Polynomial = number[];

const EXP_TABLE = new Array<number>(256);
const LOG_TABLE = new Array<number>(256);

for (let i = 0; i < 8; i += 1) {
  EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i += 1) {
  EXP_TABLE[i] = EXP_TABLE[i - 4]
    ^ EXP_TABLE[i - 5]
    ^ EXP_TABLE[i - 6]
    ^ EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) {
  LOG_TABLE[EXP_TABLE[i]] = i;
}

function gexp(n: number) {
  let value = n;
  while (value < 0) {
    value += 255;
  }
  while (value >= 256) {
    value -= 255;
  }
  return EXP_TABLE[value];
}

function glog(n: number) {
  if (n < 1) {
    throw new Error(`glog(${n})`);
  }
  return LOG_TABLE[n];
}

function polynomialMultiply(p1: Polynomial, p2: Polynomial): Polynomial {
  const result = new Array<number>(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i += 1) {
    for (let j = 0; j < p2.length; j += 1) {
      result[i + j] ^= gexp(glog(p1[i]) + glog(p2[j]));
    }
  }
  return result;
}

function polynomialMod(dividend: Polynomial, divisor: Polynomial): Polynomial {
  const result = [...dividend];
  while (result.length - divisor.length >= 0) {
    const ratio = glog(result[0]) - glog(divisor[0]);
    for (let i = 0; i < divisor.length; i += 1) {
      result[i] ^= gexp(glog(divisor[i]) + ratio);
    }
    while (result.length && result[0] === 0) {
      result.shift();
    }
  }
  return result;
}

function getErrorCorrectionPolynomial(errorCorrectLength: number) {
  let a: Polynomial = [1];
  for (let i = 0; i < errorCorrectLength; i += 1) {
    a = polynomialMultiply(a, [1, gexp(i)]);
  }
  return a;
}

type RsBlock = {
  dataCount: number;
  totalCount: number;
};

type Mode = 1 | 2 | 4 | 8;

const MODE_BYTE: Mode = 4;

const EC_BLOCK_TABLE: Record<QrErrorCorrectionLevel, number[][]> = {
  L: [
    [1, 26, 19],
    [1, 44, 34],
    [1, 70, 55],
    [1, 100, 80],
    [1, 134, 108],
    [2, 86, 68],
    [2, 98, 78],
    [2, 121, 97],
    [2, 146, 116],
    [2, 86, 68],
  ],
  M: [
    [1, 26, 16],
    [1, 44, 28],
    [1, 70, 44],
    [2, 50, 32],
    [2, 67, 43],
    [4, 43, 27],
    [2, 68, 43],
    [4, 81, 50],
    [2, 92, 36],
    [4, 50, 28],
  ],
  Q: [
    [1, 26, 13],
    [2, 36, 18],
    [2, 50, 26],
    [2, 64, 24],
    [2, 86, 32],
    [4, 46, 19],
    [4, 60, 26],
    [4, 70, 31],
    [4, 86, 36],
    [4, 54, 32],
  ],
  H: [
    [1, 26, 9],
    [2, 30, 16],
    [2, 42, 20],
    [4, 36, 16],
    [2, 50, 22],
    [4, 36, 16],
    [4, 43, 21],
    [4, 52, 26],
    [4, 60, 30],
    [4, 46, 26],
  ],
};

const PATTERN_POSITION_TABLE: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
];

function getPatternPosition(version: number) {
  return PATTERN_POSITION_TABLE[version - 1] ?? [];
}

function getBCHDigit(data: number) {
  let digit = 0;
  while (data !== 0) {
    digit += 1;
    data >>>= 1;
  }
  return digit;
}

function getBCHTypeInfo(data: number) {
  let d = data << 10;
  while (getBCHDigit(d) - getBCHDigit(0b10100110111) >= 0) {
    d ^= 0b10100110111 << (getBCHDigit(d) - getBCHDigit(0b10100110111));
  }
  return ((data << 10) | d) ^ 0b101010000010010;
}

function getBCHTypeNumber(data: number) {
  let d = data << 12;
  while (getBCHDigit(d) - getBCHDigit(0b1111100100101) >= 0) {
    d ^= 0b1111100100101 << (getBCHDigit(d) - getBCHDigit(0b1111100100101));
  }
  return (data << 12) | d;
}

function getMask(maskPattern: number, i: number, j: number) {
  switch (maskPattern) {
    case 0:
      return (i + j) % 2 === 0;
    case 1:
      return i % 2 === 0;
    case 2:
      return j % 3 === 0;
    case 3:
      return (i + j) % 3 === 0;
    case 4:
      return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
    case 5:
      return ((i * j) % 2) + ((i * j) % 3) === 0;
    case 6:
      return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
    case 7:
      return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function createData(version: number, errorCorrectionLevel: QrErrorCorrectionLevel, data: number[]) {
  const rsBlocks = getRsBlocks(version, errorCorrectionLevel);
  const buffer: number[] = [];
  let offset = 0;
  for (let r = 0; r < rsBlocks.length; r += 1) {
    const rsBlock = rsBlocks[r];
    const maxDcCount = rsBlock.dataCount;
    const maxEcCount = rsBlock.totalCount - rsBlock.dataCount;

    const dcData = data.slice(offset, offset + maxDcCount);
    offset += maxDcCount;
    const rsPoly = getErrorCorrectionPolynomial(maxEcCount);
    const rawPoly = [...dcData, ...new Array(maxEcCount).fill(0)];
    const modPoly = polynomialMod(rawPoly, rsPoly);
    const ecData = [...new Array(maxEcCount - modPoly.length).fill(0), ...modPoly];

    for (let i = 0; i < maxDcCount; i += 1) {
      buffer.push(dcData[i]);
    }
    for (let i = 0; i < maxEcCount; i += 1) {
      buffer.push(ecData[i]);
    }
  }
  return buffer;
}

function getRsBlocks(version: number, errorCorrectionLevel: QrErrorCorrectionLevel) {
  const table = EC_BLOCK_TABLE[errorCorrectionLevel];
  if (!table) {
    throw new Error("bad ec level");
  }
  if (version < 1 || version > table.length) {
    throw new Error("bad version");
  }
  const blocks: RsBlock[] = [];
  const row = table[version - 1];
  const count = row[0];
  const totalCount = row[1];
  const dataCount = row[2];
  for (let i = 0; i < count; i += 1) {
    blocks.push({ totalCount, dataCount });
  }
  return blocks;
}

function createBytes(version: number, errorCorrectionLevel: QrErrorCorrectionLevel, data: number[]) {
  const buffer: number[] = [];
  const totalDataCount = getRsBlocks(version, errorCorrectionLevel)
    .reduce((acc, block) => acc + block.dataCount, 0);
  if (data.length > totalDataCount) {
    throw new Error("code length overflow.");
  }
  buffer.push(...data);
  while (buffer.length < totalDataCount) {
    buffer.push(0);
  }
  return createData(version, errorCorrectionLevel, buffer);
}

function addData(buffer: number[], data: string) {
  const bytes = new TextEncoder().encode(data);
  buffer.push(MODE_BYTE);
  buffer.push(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) {
    buffer.push(bytes[i]);
  }
}

function setupPositionProbePattern(matrix: QrMatrix, row: number, col: number) {
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      if (row + r <= -1 || matrix.length <= row + r || col + c <= -1 || matrix.length <= col + c) {
        continue;
      }
      if (
        (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
        (2 <= r && r <= 4 && 2 <= c && c <= 4)
      ) {
        matrix[row + r][col + c] = true;
      }
    }
  }
}

function setupTimingPattern(matrix: QrMatrix) {
  for (let r = 8; r < matrix.length - 8; r += 1) {
    matrix[r][6] = r % 2 === 0;
    matrix[6][r] = r % 2 === 0;
  }
}

function setupPositionAdjustPattern(matrix: QrMatrix, version: number) {
  const pos = getPatternPosition(version);
  for (let i = 0; i < pos.length; i += 1) {
    for (let j = 0; j < pos.length; j += 1) {
      const row = pos[i];
      const col = pos[j];
      if (matrix[row][col]) {
        continue;
      }
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          matrix[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        }
      }
    }
  }
}

function setupTypeNumber(matrix: QrMatrix, version: number) {
  const bits = getBCHTypeNumber(version);
  for (let i = 0; i < 18; i += 1) {
    const mod = (bits >> i) & 1;
    matrix[Math.floor(i / 3)][(i % 3) + matrix.length - 8 - 3] = mod === 1;
    matrix[(i % 3) + matrix.length - 8 - 3][Math.floor(i / 3)] = mod === 1;
  }
}

function setupTypeInfo(matrix: QrMatrix, maskPattern: number, errorCorrectionLevel: QrErrorCorrectionLevel) {
  const ec = errorCorrectionLevel === "L" ? 1 : errorCorrectionLevel === "M" ? 0 : errorCorrectionLevel === "Q" ? 3 : 2;
  const data = (ec << 3) | maskPattern;
  const bits = getBCHTypeInfo(data);
  for (let i = 0; i < 15; i += 1) {
    const mod = (bits >> i) & 1;
    if (i < 6) {
      matrix[i][8] = mod === 1;
    } else if (i < 8) {
      matrix[i + 1][8] = mod === 1;
    } else {
      matrix[matrix.length - 15 + i][8] = mod === 1;
    }
    if (i < 8) {
      matrix[8][matrix.length - i - 1] = mod === 1;
    } else {
      matrix[8][15 - i - 1] = mod === 1;
    }
  }
  matrix[matrix.length - 8][8] = true;
}

function mapData(matrix: QrMatrix, data: number[], maskPattern: number) {
  let inc = -1;
  let row = matrix.length - 1;
  let bitIndex = 7;
  let byteIndex = 0;

  for (let col = matrix.length - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    while (true) {
      for (let c = 0; c < 2; c += 1) {
        if (matrix[row][col - c] === undefined) {
          let dark = false;
          if (byteIndex < data.length) {
            dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
          }
          if (getMask(maskPattern, row, col - c)) {
            dark = !dark;
          }
          matrix[row][col - c] = dark;
          bitIndex -= 1;
          if (bitIndex === -1) {
            byteIndex += 1;
            bitIndex = 7;
          }
        }
      }
      row += inc;
      if (row < 0 || matrix.length <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

function createMatrix(version: number, errorCorrectionLevel: QrErrorCorrectionLevel, data: string, maskPattern = 2) {
  const buffer: number[] = [];
  addData(buffer, data);
  const dataBytes = createBytes(version, errorCorrectionLevel, buffer);
  const matrixSize = version * 4 + 17;
  const matrix: QrMatrix = new Array(matrixSize)
    .fill(null)
    .map(() => new Array<boolean>(matrixSize));

  setupPositionProbePattern(matrix, 0, 0);
  setupPositionProbePattern(matrix, matrixSize - 7, 0);
  setupPositionProbePattern(matrix, 0, matrixSize - 7);
  setupTimingPattern(matrix);
  setupPositionAdjustPattern(matrix, version);
  setupTypeInfo(matrix, maskPattern, errorCorrectionLevel);
  if (version >= 7) {
    setupTypeNumber(matrix, version);
  }
  mapData(matrix, dataBytes, maskPattern);
  return matrix;
}

function chooseVersion(data: string, errorCorrectionLevel: QrErrorCorrectionLevel) {
  const bytes = new TextEncoder().encode(data).length + 2;
  const table = EC_BLOCK_TABLE[errorCorrectionLevel];
  for (let version = 1; version <= table.length; version += 1) {
    const capacity = getRsBlocks(version, errorCorrectionLevel)
      .reduce((acc, block) => acc + block.dataCount, 0);
    if (capacity >= bytes) {
      return version;
    }
  }
  return table.length;
}

export function buildQrMatrix(data: string, errorCorrectionLevel: QrErrorCorrectionLevel = "M"): QrMatrix {
  const version = chooseVersion(data, errorCorrectionLevel);
  return createMatrix(version, errorCorrectionLevel, data);
}
