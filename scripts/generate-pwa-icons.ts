import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function renderIconPng(size: number, maskable: boolean): Buffer {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const bg = [22, 128, 60, 255]; // #16803C
  const ring = [24, 59, 43, 255]; // #183B2B
  const cream = [243, 248, 240, 255]; // #F3F8F0
  const gold = [245, 185, 66, 255]; // #F5B942

  const scale = maskable ? 0.68 : 0.88;
  const cx = size / 2;
  const cy = size / 2;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const nx = (x - cx) / ((size / 2) * scale);
      const ny = (y - cy) / ((size / 2) * scale);
      const r = Math.hypot(nx, ny);

      let color = bg;
      if (r < 0.72) {
        // Subtle darker inner emblem circle
        color = [
          Math.round(bg[0] * 0.8 + ring[0] * 0.2),
          Math.round(bg[1] * 0.8 + ring[1] * 0.2),
          Math.round(bg[2] * 0.8 + ring[2] * 0.2),
          255,
        ];
      }

      // Gold seed/sun near top
      const sunDist = Math.hypot(nx, ny + 0.42);
      if (sunDist < 0.14) {
        color = gold;
      }

      // Vertical stem
      if (Math.abs(nx) < 0.055 && ny >= -0.2 && ny <= 0.52) {
        color = cream;
      }

      // Left leaf (curved teardrop)
      const lx = nx + 0.24;
      const ly = ny - 0.02;
      if (lx * lx * 1.4 + ly * ly * 2.2 < 0.095 && nx <= 0.02 && ny <= 0.18) {
        color = cream;
      }

      // Right leaf (higher)
      const rx = nx - 0.24;
      const ry = ny + 0.14;
      if (rx * rx * 1.4 + ry * ry * 2.2 < 0.095 && nx >= -0.02 && ny <= 0.04) {
        color = cream;
      }

      const idx = rowStart + 1 + x * 4;
      raw[idx] = color[0];
      raw[idx + 1] = color[1];
      raw[idx + 2] = color[2];
      raw[idx + 3] = color[3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, {level: 9});
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), renderIconPng(192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), renderIconPng(512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), renderIconPng(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), renderIconPng(180, false));
console.log('Generated PWA PNG icons in public/.');
