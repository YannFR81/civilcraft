/* SPDX-License-Identifier: Apache-2.0 */
/**
 * profile.js — vertical profiles along an alignment. No DOM.
 *
 *   sampleSurface(surface, alignment, { step }) → [{ sta, z | null }]
 *     existing ground: the surface's elevation at every `step` along the alignment and at the
 *     alignment's key stations. Default step = length / 1000, at least 0.5 unit.
 *   buildProfile(pvis) → Profile        design grade by PVIs with symmetric parabolic vertical curves
 *     pvis: [{ sta, z, L }] in station order; L = vertical curve length at an interior PVI (0 = a
 *     grade break). Or give { K } instead of L: L = K·|A| (A = grade change in percent).
 *   p.curves   [{ i, pvi, bvc, evc, L, K, g1, g2, A, zBvc, zEvc, kind: 'crest'|'sag', high|low: {sta, z} }]
 *   p.grades   [{ from, to, g }]   (g = rise/run)
 *   p.elevationAt(sta), p.gradeAt(sta), p.errors
 *
 * On a curve from BVC (x = 0) to EVC (x = L): z = zBVC + g1·x + (g2 − g1)·x² / (2L). The high or low
 * point is at x = −g1·L / (g2 − g1) when the grades change sign.
 *
 * Circular vertical curves (the French practice, LandXML CircCurve): give { R } (radius, > 0) at an interior PVI
 * instead of L or K. The curve is the true circle of radius R tangent to both grades (in the station–elevation plane,
 * unexaggerated): with θ = atan(g), the tangent length is T = R·tan(|θ2 − θ1| / 2), BVC = PVI − T·cos θ1 and
 * EVC = PVI + T·cos θ2 (not symmetric about the PVI in station). Its record carries type 'circ', R, the centre
 * (xc, zc) and sgn (+1 sag: the centre is above; −1 crest); L is its length in station (EVC − BVC) and K = L / |A|,
 * so code that reads only L, bvc and evc keeps working. R wins over L and K at the same PVI.
 */

import { t } from "./i18n.js";

export function sampleSurface(surface, alignment, { step } = {}) {
  if (!surface || !alignment?.ok) return [];
  const st = step > 0 ? step : Math.max(0.5, alignment.length / 1000);
  const stas = new Set();
  for (let s = alignment.start; s < alignment.end; s += st) stas.add(Number(s.toFixed(6)));
  stas.add(alignment.end);
  for (const k of alignment.keyStations()) stas.add(k.sta);
  return [...stas].sort((a, b) => a - b).map((sta) => {
    const p = alignment.pointAt(sta);
    return { sta, z: surface.elevationAt(p.x, p.y, 1e-6) };
  });
}

export function buildProfile(pvisIn) {
  const errors = [];
  const pvis = (pvisIn || []).filter((p) => Number.isFinite(p.sta) && Number.isFinite(p.z)).map((p) => ({ ...p })).sort((a, b) => a.sta - b.sta);
  for (let i = 1; i < pvis.length; i++) if (pvis[i].sta - pvis[i - 1].sta < 1e-6) errors.push(t('prof.err.two', { sta: pvis[i].sta }));
  const grades = [];
  for (let i = 0; i + 1 < pvis.length; i++) grades.push({ from: pvis[i].sta, to: pvis[i + 1].sta, g: (pvis[i + 1].z - pvis[i].z) / (pvis[i + 1].sta - pvis[i].sta) });
  const curves = [];
  for (let i = 1; i + 1 < pvis.length; i++) {
    const v = pvis[i], g1 = grades[i - 1].g, g2 = grades[i].g, A = (g2 - g1) * 100;
    if (Number(v.R) > 0) {
      if (Math.abs(A) < 1e-9) { v.L = 0; continue; }
      const c = circularCurve(i, v, g1, g2, Number(v.R));
      v.L = c.L;
      curves.push(c);
      continue;
    }
    let L = Number(v.L) || 0;
    if (!L && Number(v.K) > 0) L = Number(v.K) * Math.abs(A);
    v.L = L;
    if (L <= 0 || Math.abs(A) < 1e-9) continue;
    const bvc = v.sta - L / 2, evc = v.sta + L / 2;
    const c = { i, pvi: v.sta, zPvi: v.z, bvc, evc, L, g1, g2, A, K: L / Math.abs(A), zBvc: v.z - g1 * L / 2, zEvc: v.z + g2 * L / 2, kind: g2 < g1 ? 'crest' : 'sag' };
    if (g1 * g2 < 0) {
      const x = -g1 * L / (g2 - g1);
      const pt = { sta: bvc + x, z: c.zBvc + g1 * x + (g2 - g1) * x * x / (2 * L) };
      if (c.kind === 'crest') c.high = pt; else c.low = pt;
    }
    curves.push(c);
  }
  // curves must stay between their neighbours and not overlap
  for (let k = 0; k < curves.length; k++) {
    const c = curves[k], prevEnd = k ? curves[k - 1].evc : pvis[0].sta;
    const left = pvis[c.i - 1].sta, right = pvis[c.i + 1].sta;
    if (c.bvc < left - 1e-9 || c.bvc < prevEnd - 1e-9) errors.push(t('prof.err.before', { pvi: c.i + 1, len: c.L.toFixed(2) }));
    if (c.evc > right + 1e-9) errors.push(t('prof.err.past', { pvi: c.i + 1, len: c.L.toFixed(2) }));
  }
  return new Profile(pvis, grades, curves, errors);
}

/** The circle of radius R tangent to grades g1 and g2 at PVI v (see the header). */
export function circularCurve(i, v, g1, g2, R) {
  const th1 = Math.atan(g1), th2 = Math.atan(g2), T = R * Math.tan(Math.abs(th2 - th1) / 2);
  const bvc = v.sta - T * Math.cos(th1), evc = v.sta + T * Math.cos(th2);
  const zBvc = v.z - T * Math.sin(th1), zEvc = v.z + T * Math.sin(th2);
  const sgn = g2 > g1 ? 1 : -1;                                  // +1 sag (centre above), −1 crest
  const xc = bvc - sgn * R * Math.sin(th1), zc = zBvc + sgn * R * Math.cos(th1);
  const L = evc - bvc, A = (g2 - g1) * 100;
  const c = { i, pvi: v.sta, zPvi: v.z, bvc, evc, L, g1, g2, A, K: L / Math.abs(A), zBvc, zEvc, kind: sgn > 0 ? 'sag' : 'crest', type: 'circ', R, T, xc, zc, sgn };
  if (g1 * g2 < 0) { const pt = { sta: xc, z: zc - sgn * R }; if (sgn < 0) c.high = pt; else c.low = pt; }
  return c;
}

const circZ = (c, sta) => { const d = sta - c.xc; return c.zc - c.sgn * Math.sqrt(Math.max(0, c.R * c.R - d * d)); };
const circG = (c, sta) => { const d = sta - c.xc; return c.sgn * d / Math.sqrt(Math.max(1e-300, c.R * c.R - d * d)); };

export class Profile {
  constructor(pvis, grades, curves, errors) {
    this.pvis = pvis; this.grades = grades; this.curves = curves; this.errors = errors;
    this.start = pvis.length ? pvis[0].sta : 0;
    this.end = pvis.length ? pvis[pvis.length - 1].sta : 0;
  }
  get ok() { return this.pvis.length >= 2 && !this.errors.length; }

  elevationAt(sta) {
    const P = this.pvis;
    if (P.length < 2 || sta < this.start - 1e-9 || sta > this.end + 1e-9) return null;
    for (const c of this.curves) if (sta >= c.bvc && sta <= c.evc) { if (c.type === 'circ') return circZ(c, sta); const x = sta - c.bvc; return c.zBvc + c.g1 * x + (c.g2 - c.g1) * x * x / (2 * c.L); }
    for (let i = 0; i + 1 < P.length; i++) if (sta <= P[i + 1].sta + 1e-9) return P[i].z + this.grades[i].g * (sta - P[i].sta);
    return null;
  }
  gradeAt(sta) {
    for (const c of this.curves) if (sta >= c.bvc && sta <= c.evc) return c.type === 'circ' ? circG(c, sta) : c.g1 + (c.g2 - c.g1) * (sta - c.bvc) / c.L;
    for (const g of this.grades) if (sta <= g.to + 1e-9) return g.g;
    return null;
  }
  /** Stations to draw at: every step plus curve ends and PVIs. */
  sample(step) {
    const s = new Set(this.pvis.map((p) => p.sta));
    for (const c of this.curves) { const n = Math.max(8, Math.ceil(c.L / (step || c.L / 32))); for (let k = 0; k <= n; k++) s.add(c.bvc + (c.L * k) / n); }
    return [...s].sort((a, b) => a - b).map((sta) => ({ sta, z: this.elevationAt(sta) }));
  }
}
