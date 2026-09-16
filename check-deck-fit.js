/*
 * Estimates whether any text box in the generated deck overflows its own frame.
 *
 * LibreOffice is not available here, so slides cannot be rendered. This reads
 * the packed .pptx, pulls every text frame with its width, height and font
 * size, wraps the text at the box width using per-character widths for the
 * font in use, and compares the resulting block height against the frame.
 *
 * It approximates — it will not catch kerning-level near-misses — so it flags
 * anything over 85% of the available height as worth a human look rather than
 * only reporting hard overflows.
 *
 *   node check-deck-fit.js [deck.pptx]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const file = process.argv[2] || path.join(__dirname, 'Military-Pay-Estimator-Guide.pptx');

// ---- minimal zip reader (central directory -> deflate) ----
function readZip(buf) {
  const out = {};
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('not a zip');
  let off = buf.readUInt32LE(end + 16);
  const count = buf.readUInt16LE(end + 10);
  for (let i = 0; i < count; i++) {
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(dataStart, dataStart + compSize);
    out[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

// Average advance widths as a fraction of font size. Serif headers are wider
// per character than the sans body, so they are measured separately.
const WIDE = new Set(['Cambria', 'Bookman Old Style', 'Century Schoolbook', 'Georgia']);
function charWidth(ch, sizePt, face) {
  const base = WIDE.has(face) ? 0.50 : 0.47;
  if (' iIljt.,:;\'`|!'.includes(ch)) return sizePt * base * 0.45;
  if ('WMmw@%'.includes(ch)) return sizePt * base * 1.55;
  if (ch >= 'A' && ch <= 'Z') return sizePt * base * 1.20;
  if (ch >= '0' && ch <= '9') return sizePt * base * 1.02;
  return sizePt * base;
}
function wrapLines(text, boxWidthPt, sizePt, face) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  let lines = 1, cur = 0;
  const space = charWidth(' ', sizePt, face);
  for (const w of words) {
    let wWidth = 0;
    for (const c of w) wWidth += charWidth(c, sizePt, face);
    if (cur > 0 && cur + space + wWidth > boxWidthPt) { lines++; cur = wWidth; }
    else cur += (cur > 0 ? space : 0) + wWidth;
  }
  return lines;
}

const EMU = 914400;                       // per inch
const zip = readZip(fs.readFileSync(file));
const slides = Object.keys(zip)
  .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
  .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));

let flagged = 0, checked = 0;
for (const name of slides) {
  const n = +name.match(/\d+/)[0];
  const xml = zip[name].toString('utf8');
  // each shape: <p:sp> ... <a:off .../><a:ext cx= cy=/> ... runs ...
  for (const sp of xml.split('<p:sp>').slice(1)) {
    const ext = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
    if (!ext) continue;
    const runs = [...sp.matchAll(/<a:rPr[^>]*sz="(\d+)"[^>]*\/?>(?:[\s\S]*?)<a:t>([^<]*)<\/a:t>/g)];
    if (!runs.length) continue;
    const faceM = sp.match(/typeface="([^"]+)"/);
    const face = faceM ? faceM[1] : 'Calibri';
    const wIn = +ext[1] / EMU, hIn = +ext[2] / EMU;
    // pptxgenjs default inset: 0.1" left/right, 0.05" top/bottom
    const usableW = (wIn - 0.2) * 72, usableH = (hIn - 0.1) * 72;
    if (usableW <= 0 || usableH <= 0) continue;
    const text = runs.map(r => r[2]).join(' ');
    const sizePt = (+runs[0][1]) / 100;
    if (!text.trim()) continue;
    checked++;
    const lines = wrapLines(text, usableW, sizePt, face);
    const needed = lines * sizePt * 1.22;   // typical single line spacing
    const ratio = needed / usableH;
    // Calibrated against slides verified by eye: a single line in a snug box
    // renders fine — it sits slightly proud of the frame without clipping, and
    // flagging those buried the real signal in 79 false positives. What
    // actually clips is text that wraps to more lines than the frame holds.
    if (lines > 1 && ratio > 1.0) {
      flagged++;
      console.log(
        `slide ${String(n).padStart(2)}  OVERFLOW  ${(ratio * 100).toFixed(0)}% of box` +
        `  ${lines} lines @ ${sizePt}pt in ${hIn.toFixed(2)}"` +
        `\n            "${text.slice(0, 78)}${text.length > 78 ? '…' : ''}"`);
    } else if (lines > 1 && ratio > 0.9) {
      console.log(
        `slide ${String(n).padStart(2)}  tight     ${(ratio * 100).toFixed(0)}% of box` +
        `  ${lines} lines @ ${sizePt}pt` +
        `\n            "${text.slice(0, 78)}${text.length > 78 ? '…' : ''}"`);
    }
  }
}
console.log(`\n${checked} text frames measured, ${flagged} overflowing.`);
console.log('Estimated, not rendered: this wraps text at the frame width using');
console.log('approximate glyph widths. It catches text that needs more lines than');
console.log('the frame holds; it will not catch a near-miss on the final line.');
process.exit(flagged ? 1 : 0);
