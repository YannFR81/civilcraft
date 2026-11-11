/* SPDX-License-Identifier: Apache-2.0 */
/**
 * axis-table.js — the table of an alignment's elements, as a French road designer reads it (tableau des éléments d'axe):
 * one row per straight, arc and transition, with its stations, length, radius (R0 → R1 for a transition), clothoid
 * parameter A, direction at its start and its start point. No DOM; the Node test drives it (bin/test-civilcraft-axis-table.mjs).
 *
 *   gisement(dir) → gons: the direction from north, clockwise, 0 ≤ g < 400 (dir in radians, math convention: 0 = east, CCW)
 *   elementTable(al) → [{ n, type: 'line'|'arc'|'spiral', kind (the transition's shape, 'clothoid'…), side: 'L'|'R'|null,
 *       sta0, sta1, len, r0, r1 (null = infinite: a straight, or the straight end of a transition), A (√(R·L) for a
 *       clothoid; null otherwise), dir0, dir1 (radians), x0, y0, x1, y1 }]
 *   tableCsv(rows, { sep, dec, angle: 'gon'|'deg', head }) → text: one header line (head: the column names, else English
 *       ones) and one line per row; sep ';' and dec ',' for a French spreadsheet; the angle as a gisement in gons or as
 *       a bearing in decimal degrees (from north, clockwise)
 */

export function gisement(dir) {
  let g = ((Math.PI / 2 - dir) * 200) / Math.PI;
  g = ((g % 400) + 400) % 400;
  return g >= 400 - 1e-12 ? 0 : g;
}

export function elementTable(al) {
  if (!al?.ok) return [];
  const rows = [];
  for (const e of al.elements) {
    if (!(e.len > 1e-9)) continue;
    const a = al.pointAt(e.sta), b = al.pointAt(e.sta + e.len);
    const row = { n: rows.length + 1, type: e.type, kind: e.type === 'spiral' ? (e.tr || 'clothoid') : null, side: e.type === 'line' ? null : e.ccw ? 'L' : 'R',
      sta0: e.sta, sta1: e.sta + e.len, len: e.len, r0: null, r1: null, A: null, dir0: a.dir, dir1: b.dir, x0: a.x, y0: a.y, x1: b.x, y1: b.y };
    if (e.type === 'arc') { row.r0 = e.r; row.r1 = e.r; }
    if (e.type === 'spiral') {
      if (e.io === 'in') row.r1 = e.r; else row.r0 = e.r;
      if (row.kind === 'clothoid') row.A = Math.sqrt(e.r * (e.Lp ?? e.Ls));
    }
    rows.push(row);
  }
  return rows;
}

const HEAD = ['No', 'Type', 'Side', 'Station start', 'Station end', 'Length', 'R start', 'R end', 'A', 'Direction start', 'X start', 'Y start', 'X end', 'Y end'];

export function tableCsv(rows, { sep = ',', dec = '.', angle = 'gon', head = HEAD } = {}) {
  const num = (v, d) => (v === null || v === undefined ? '' : Number(v).toFixed(d).replace('.', dec));
  const ang = (dir) => (angle === 'gon' ? num(gisement(dir), 4) : num((gisement(dir) * 360) / 400, 4));
  const q = (s) => (String(s).includes(sep) || /["\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s));
  const lines = [head.map(q).join(sep)];
  for (const r of rows) {
    lines.push([r.n, r.type === 'spiral' ? r.kind : r.type, r.side || '', num(r.sta0, 3), num(r.sta1, 3), num(r.len, 3), num(r.r0, 3), num(r.r1, 3), num(r.A, 3), ang(r.dir0), num(r.x0, 3), num(r.y0, 3), num(r.x1, 3), num(r.y1, 3)].map(q).join(sep));
  }
  return lines.join('\r\n') + '\r\n';
}
