// scripts/gen-fixture-pdf.js
// Generates tests/fixtures/beryllium.pdf: a minimal single-page PDF whose only
// text content is "The atomic number of Beryllium is 4." Used by the Phase 1
// attachment-grounding E2E gate. No deps — computes its own xref/byte ranges so the
// file is a spec-valid, OCR-able PDF.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const text = "The atomic number of Beryllium is 4.";

// Content stream: place the text at a readable position using the standard
// Helvetica font /F1 at 24pt.
const stream = `BT\n/F1 24 Tf\n72 720 Td\n(${text}) Tj\nET\n`;
const compressed = zlib.deflateSync(stream).toString("latin1");
const streamBytes = Buffer.from(compressed, "latin1");

const objects = [];
let pdf = "%PDF-1.4\n";
let offset = pdf.length;

// 1: Catalog
objects.push({ ref: 1, offset });
pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

// 2: Pages
objects.push({ ref: 2, offset: offset + (pdf.length - offset) });
const pagesObj = pdf.length - offset;

// We need per-object offsets; build incrementally instead:
// (Rebuild with running offsets.)
// Reset and build properly:
pdf = "%PDF-1.4\n";

const addObj = (fn) => {
  const off = pdf.length;
  const body = fn();
  pdf += body;
  offsets.push(off);
};

const offsets = [];
addObj(() => "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
addObj(() =>
  "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
);
addObj(() =>
  `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
);
const streamStr = streamBytes;
addObj(() =>
  `4 0 obj\n<< /Length ${streamStr.length} /Filter /FlateDecode >>\nstream\n` +
  streamStr.toString("latin1") +
  "endstream\nendobj\n"
);
addObj(() =>
  "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
);

const xrefPos = pdf.length;
const count = offsets.length;
let xref = "xref\n0 " + count + "\n";
xref += "0000000000 65535 f \n";
for (let i = 1; i < count; i++) {
  const off = offsets[i];
  xref += String(off).padStart(10, "0") + " 00000 n \n";
}
pdf += xref;
pdf += "trailer\n<< /Size " + count + " /Root 1 0 R >>\n";
pdf += "startxref\n" + xrefPos + "\n%%EOF\n";

const out = path.join(__dirname, "..", "tests", "fixtures", "beryllium.pdf");
fs.mkdirSync(path.dirname(out), { recursive: true });
// latin1 preserves high bytes of the FlateDecode stream verbatim (utf8 would mangle them).
fs.writeFileSync(out, pdf, "latin1");
console.log("Wrote", out, pdf.length, "bytes");
