#!/usr/bin/env node
/* SPDX-License-Identifier: Apache-2.0 */
/**
 * test-civilcraft-axis-table.mjs — the table of an alignment's elements (axis-table.js), DOM-free, in Node.
 *
 *   node bin/test-civilcraft-axis-table.mjs [--build dev|x.y] [--verbose]
 *
 * By hand: gisements (east 100 gon, north 0, west 300, south 200; from north, clockwise); an axis east, a 300 m curve to
 * the left with 60 m clothoids, then north-east: five elements (straight, clothoid ∞ → 300, arc 300, clothoid 300 → ∞,
 * straight), stations end to end, A = √(300 · 60) = 134.16, each start on the previous end, the arc's side; the CSV for a
 * French spreadsheet (; and ,) and in degrees.
 */
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const BUILD = arg('--build') || 'dev';
const VERBOSE = process.argv.includes('--verbose');
const APP = path.join(REPO, 'public_html/assets/apps/civilcraft', BUILD);
const manifest = JSON.parse(fs.readFileSync(path.join(APP, 'manifest.json'), 'utf8'));
registerHooks({
  resolve(spec, ctx, next) {
    const m = manifest.imports?.[spec];
    if (m) return { url: pathToFileURL(path.join(REPO, 'public_html', m)).href, shortCircuit: true };
    return next(spec, ctx);
  },
});
const mod = (f) => import(pathToFileURL(path.join(APP, f)).href);
const I18N = await mod('i18n.js');
I18N.init({ strings: JSON.parse(fs.readFileSync(path.join(APP, 'lang/en.json'), 'utf8')) });
const AT = await mod('axis-table.js');
const AL = await mod('alignment.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (VERBOSE) console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Number.isFinite(a) && Math.abs(a - b) <= tol, `${m} (${a} vs ${b}, ±${tol})`);
const section = (s) => console.log('\n== ' + s);

section('gisements');
{
  near(AT.gisement(0), 100, 1e-12, 'east = 100 gon');
  near(AT.gisement(Math.PI / 2), 0, 1e-12, 'north = 0');
  near(AT.gisement(Math.PI), 300, 1e-12, 'west = 300');
  near(AT.gisement(-Math.PI / 2), 200, 1e-12, 'south = 200');
  near(AT.gisement(Math.PI / 4), 50, 1e-12, 'north-east = 50');
  ok(AT.gisement(Math.PI / 2 + 1e-15) >= 0 && AT.gisement(Math.PI / 2 + 1e-15) < 400, 'always 0 ≤ g < 400');
}

section('an axis with clothoids');
{
  const al = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 500, y: 0, r: 300, ls1: 60, ls2: 60 }, { x: 900, y: 400 }] });
  const rows = AT.elementTable(al);
  ok(rows.map((r) => r.type).join(',') === 'line,spiral,arc,spiral,line', 'straight, clothoid, arc, clothoid, straight');
  ok(rows.every((r, i) => i === 0 || Math.abs(r.sta0 - rows[i - 1].sta1) < 1e-9) && Math.abs(rows[4].sta1 - al.end) < 1e-9, 'stations end to end, to the end of the axis');
  ok(rows.every((r, i) => i === 0 || Math.hypot(r.x0 - rows[i - 1].x1, r.y0 - rows[i - 1].y1) < 1e-6), 'each element starts where the last one ends');
  ok(rows[1].r0 === null && rows[1].r1 === 300 && rows[3].r0 === 300 && rows[3].r1 === null && rows[2].r0 === 300, 'radii: ∞ → 300, 300, 300 → ∞');
  near(rows[1].A, Math.sqrt(300 * 60), 1e-9, 'A = √(R·L) = 134.16');
  near(rows[1].len, 60, 1e-6, 'clothoid length 60 m');
  ok(rows[2].side === 'L' && rows[0].side === null, 'a curve to the left; a straight has no side');
  near(AT.gisement(rows[0].dir0), 100, 1e-9, 'the first straight runs east: 100 gon');
  near(AT.gisement(rows[4].dir0), 50, 1e-6, 'the last runs north-east: 50 gon');
  near(rows.reduce((s, r) => s + r.len, 0), al.length, 1e-6, 'lengths add up to the axis length');
  const csv = AT.tableCsv(rows, { sep: ';', dec: ',', angle: 'gon' }), lines = csv.trim().split('\r\n');
  ok(lines.length === 6 && lines[0].split(';').length === 14, 'CSV: a header and five rows, 14 columns');
  ok(lines[1].split(';')[9] === '100,0000' && lines[2].split(';')[1] === 'clothoid' && lines[2].split(';')[8] === '134,164', 'CSV: decimal comma, gisement and A');
  ok(AT.tableCsv(rows, { angle: 'deg' }).trim().split('\r\n')[1].split(',')[9] === '90.0000', 'CSV in degrees: east = 90°');
  ok(AT.elementTable(null).length === 0 && AT.elementTable({ ok: false }).length === 0, 'no axis: no rows');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
