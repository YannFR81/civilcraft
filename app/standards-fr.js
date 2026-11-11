/* SPDX-License-Identifier: Apache-2.0 */
/**
 * standards-fr.js — French road design standards as data, and an alignment's check against one. No DOM; the Node test
 * drives it (bin/test-civilcraft-standards-fr.mjs).
 *
 * Nothing here is a number of its own: every value comes from a table below that names its source, and a standard marked
 * verified: false says so in every report. A category value that is null is not checked. Radii in metres (a project in
 * feet converts with k = 1 / 0.3048; see checkAlignment).
 *
 *   STANDARDS                         { id → standard: id, short (for a list), name, verified, source, note, … }   ARP 1994, ARP 2022 (unverified), ICTAAL 2015, ICTAVRU 2009
 *   cleanNorm(o) → { std, cat, lanes } | null            (untrusted: the project file; alignment.norm)
 *   categoryOf(norm) → { std, cat: name, c: values } | null
 *   superelevation(std, c, R) → % toward the inside (negative: crown kept) | null (the standard gives no law)
 *   clothoidNeededBelow(std, c) → radius under which a curve takes clothoids | null
 *   clothoidLength(std, c, R, lanes) → recommended clothoid length (m) | null
 *   rateTable(std, c, units) → superelev.js rate table [[radius ≥, e | null]…] from the law, in 0.5 % steps | null
 *   checkAlignment(al, prof, norm, units) → { std, cat, findings: [{ level: 'error'|'warning'|'info', key, args }], errors, warnings }
 *       al = alignment.js Alignment (its curves: r, ls1, ls2), prof = profile.js Profile | null (its curves: R for a circle,
 *       else the parabola's radius at its vertex L / |Δg|; its grades). Keys are i18n keys (nf.*).
 *
 * The rules (as in the IngeCAD roads plugin's norms.py, the same tables):
 *   superelevation: R ≥ Rnd → crown kept; a category with a superelevation range (ICTAVRU U) → its top value; law
 *     'inverse_linear': dmin at R ≥ Rdm, dmax at R ≤ Rm, linear in 1/R between.
 *   clothoids: needed under factor × the category's required_below radius; length 'k_r04' = k(lanes)·R^0.4 capped
 *     (ARP 1994: 6, 9, 12 for 2, 3, 4 lanes, caps 67, 100, 133 m); 'max_14dd_r9' = max(14·Δd, R / 9), Δd = d − crown (%).
 *   chaining: 'ratio_both' — two curves in a row keep R1/R2 between 1/ratio and ratio unless both are above a radius;
 *     'ratio_next' — a curve under factor × Rnd met after a curve more than ratio times larger, in either direction.
 *   vertical: crest radius ≥ crest_min, sag radius ≥ sag_min, |grade| ≤ grade_max.
 */

export const STANDARDS = {
  ARP1994: {
    id: 'ARP1994', short: 'ARP 1994', name: 'ARP — Aménagement des routes principales (Sétra, 1994)', verified: true,
    source: 'ARP, Sétra, août 1994 (circulaire du 5 août 1994, valant ICTARN) : §3.1 tracé en plan, annexe 1 dévers, §3.2 profil en long ; longueurs de clothoïde : Cerema DT4044.',
    note: "Rm, Rdm, Rnd, profil en long et longueurs de clothoïde de l'ARP 1994. Remplacé par l'ARP 2022 pour les routes ordinaires : garder pour les études qui s'y réfèrent.",
    superelevation: { law: 'inverse_linear', max: 7.0, min: 2.5, crown: -2.5, reduced_max: 5.0 },
    clothoid: { required_below: 'rnd', factor: 1.0, length: { formula: 'k_r04', k: { 2: 6, 3: 9, 4: 12 }, cap: { 2: 67, 3: 100, 4: 133 } } },
    chaining: { rule: 'ratio_both', ratio: 1.5, unless_both_above: 500 },
    categories: {
      R60: { rm: 120, rdm: 450, rnd: 600, crest_min: 1500, sag_min: 1500, grade_max: 7 },
      R80: { rm: 240, rdm: 650, rnd: 900, crest_min: 3000, sag_min: 2200, grade_max: 6 },
      T80: { rm: 240, rdm: 650, rnd: 900, crest_min: 3000, sag_min: 2200, grade_max: 6 },
      T100: { rm: 425, rdm: 900, rnd: 1300, crest_min: 6000, sag_min: 3000, grade_max: 5 },
    },
  },
  ARP2022: {
    id: 'ARP2022', short: 'ARP 2022', name: 'ARP — Aménagement des routes principales (Cerema, 2022)', verified: false,
    source: 'ARP, Cerema, août 2022 (DT9075) : chap. 4 tableau 10 (rayons), tableau 11 (raccordements progressifs).',
    note: 'Valeurs relevées dans une source secondaire, pas dans le guide lui-même : à vérifier et compléter (tableaux 10 et 11, terme de gauchissement de la longueur de clothoïde, profil en long). Rdn sert ici de rayon non déversé et de rayon au dévers minimal.',
    superelevation: { law: 'inverse_linear', max: 7.0, min: 2.5, crown: -2.5, reduced_max: 5.0 },
    clothoid: { required_below: 'rnd', factor: 1.0, length: { formula: 'k_r04', k: { 2: 6, 3: 12, 4: 12 }, cap: {} } },
    chaining: null,
    categories: {
      R1: { rm: 240, rdm: 400, rnd: 400 },
      R2: { rm: 125, rdm: 400, rnd: 400 },
      Artere110: { rm: null, rdm: 650, rnd: 650 },
    },
  },
  ICTAAL2015: {
    id: 'ICTAAL2015', short: 'ICTAAL 2015', name: 'ICTAAL — Autoroutes de liaison (Cerema, 2015)', verified: true,
    source: "ICTAAL, édition 2015 (instruction du 13/07/2015) : tableau 3-1 (tracé en plan), tableau 3-2 (profil en long), §3.1 raccordements progressifs ; §8.2.2 relief difficile.",
    note: "Courbes de rayon < 1,5 Rdn introduites par des clothoïdes de longueur au moins égale à max(14 Δδ, R/9). La loi de dévers n'est pas reprise ici : la vérifier dans l'instruction.",
    superelevation: { law: null, crown: -2.5 },
    clothoid: { required_below: 'rnd', factor: 1.5, length: { formula: 'max_14dd_r9' } },
    chaining: { rule: 'ratio_next', ratio: 1.5, applies_below_factor: 1.5 },
    categories: {
      L1: { rm: 600, rdm: 1000, rnd: 1000, crest_min: 12500, sag_min: 4200, grade_max: 5 },
      L2: { rm: 400, rdm: 650, rnd: 650, crest_min: 6000, sag_min: 3000, grade_max: 6 },
      'L2-relief-difficile': { rm: 240, rdm: 650, rnd: 650, crest_min: 2700, sag_min: 3000, grade_max: 6 },
    },
  },
  ICTAVRU2009: {
    id: 'ICTAVRU2009', short: 'ICTAVRU 2009', name: 'ICTAVRU — Voies rapides urbaines (Certu, 1990, réédition 2009)', verified: true,
    source: 'ICTAVRU, Certu, 1990, réédition de mars 2009 : §2.1 voies de type A, §2.2 voies de type U, §3 profil en long.',
    note: "Type A : dévers 5 % au rayon minimal, 2,5 % au rayon au dévers minimal, interpolation en 1/R. Type U : entre Rm et Rnd, dévers vers l'intérieur entre 1 % et 2,5 %. Clothoïdes pour R < Rnd, de longueur max(14 (δ - δ0), R/9).",
    superelevation: { law: 'inverse_linear', max: 5.0, min: 2.5, crown: -2.5 },
    clothoid: { required_below: 'rnd', factor: 1.0, length: { formula: 'max_14dd_r9' } },
    chaining: null,
    categories: {
      A80: { rm: 240, rdm: 300, rnd: 400, crest_min: 3000, crest_normal: 6000, sag_min: 1000, grade_max: 6 },
      A100: { rm: 425, rdm: 500, rnd: 800, crest_min: 6000, crest_normal: 10000, sag_min: 1500, grade_max: 5 },
      U60: { rm: 120, rdm: 200, rnd: 200, crest_min: 1500, crest_normal: 2500, sag_min: 800, grade_max: 6, superelevation_range: [1.0, 2.5] },
      U80: { rm: 240, rdm: 400, rnd: 400, crest_min: 3000, crest_normal: 6000, sag_min: 1000, grade_max: 6, superelevation_range: [1.0, 2.5] },
    },
  },
};

const FT = 0.3048;

export function cleanNorm(o) {
  if (!o || typeof o !== 'object') return null;
  const std = STANDARDS[o.std];
  if (!std) return null;
  const cat = Object.keys(std.categories).find((k) => k === o.cat) || Object.keys(std.categories)[0];
  const lanes = [2, 3, 4].includes(o.lanes) ? o.lanes : 2;
  return { std: std.id, cat, ...(lanes !== 2 ? { lanes } : {}) };
}

export function categoryOf(norm) {
  const n = cleanNorm(norm);
  if (!n) return null;
  return { std: STANDARDS[n.std], cat: n.cat, c: STANDARDS[n.std].categories[n.cat], lanes: n.lanes || 2 };
}

export function superelevation(std, c, R) {
  const law = std.superelevation || {}, crown = law.crown ?? -2.5;
  if (c.rnd != null && R >= c.rnd) return crown;
  if (c.superelevation_range) return Number(c.superelevation_range[1]);
  if (law.law !== 'inverse_linear' || c.rdm == null || c.rm == null) return null;
  const dmin = law.min, dmax = law.max;
  if (R >= c.rdm) return dmin;
  if (R <= c.rm) return dmax;
  return dmin + ((dmax - dmin) * (1 / R - 1 / c.rdm)) / (1 / c.rm - 1 / c.rdm);
}

export function clothoidNeededBelow(std, c) {
  const base = c[std.clothoid?.required_below || 'rnd'];
  return base == null ? null : base * (std.clothoid?.factor ?? 1);
}

export function clothoidLength(std, c, R, lanes = 2) {
  const L = std.clothoid?.length || {};
  if (L.formula === 'k_r04') {
    const k = L.k?.[lanes] ?? L.k?.[2];
    if (k == null) return null;
    const v = k * Math.pow(R, 0.4), cap = L.cap?.[lanes];
    return cap ? Math.min(v, cap) : v;
  }
  if (L.formula === 'max_14dd_r9') {
    const d = superelevation(std, c, R), crown = std.superelevation?.crown ?? -2.5;
    return Math.max(14 * (d !== null ? d - crown : 0), R / 9);
  }
  return null;
}

/** The law as superelev.js's step table (radius ≥ → e, the first row that the radius reaches): normal crown from Rnd up,
 *  dmin from Rdm up, then each 0.5 % step e from the radius R(e) where the law reaches e — so a radius between R(e) and
 *  R(e − 0.5) gets e, the law's value rounded up to the next 0.5 % — down to dmax under Rm (the last row, from 0). */
export function rateTable(std, c, units = 'm') {
  const k = units === 'm' ? 1 : 1 / FT, law = std.superelevation || {}, r = (v) => Math.round(v * k * 100) / 100;
  if (c.rnd == null) return null;
  if (c.superelevation_range) return [[r(c.rnd), null], [0, c.superelevation_range[1] / 100]];
  if (law.law !== 'inverse_linear' || c.rm == null || c.rdm == null) return null;
  const Rof = (e) => 1 / (1 / c.rdm + ((e - law.min) * (1 / c.rm - 1 / c.rdm)) / (law.max - law.min));
  const rows = [[r(c.rnd), null]];
  if (c.rdm < c.rnd) rows.push([r(c.rdm), law.min / 100]);
  for (let e = law.min + 0.5; e < law.max - 1e-9; e += 0.5) rows.push([r(Rof(e)), Math.round(e * 10) / 1000]);
  rows.push([0, law.max / 100]);
  return rows;
}

export function checkAlignment(al, prof, norm, units = 'm') {
  const sel = categoryOf(norm);
  if (!sel || !al?.ok) return null;
  const { std, cat, c, lanes } = sel, k = units === 'm' ? 1 : FT;   // k: project unit → metres
  const findings = [], add = (level, key, args) => findings.push({ level, key, args });
  const m = (v) => v * k, fx = (v, d = 0) => Number(v).toFixed(d);
  const curves = (al.curves || []).map((q, i) => ({ n: i + 1, r: m(q.r), ls1: m(q.ls1 || 0), ls2: m(q.ls2 || 0) }));
  const needs = clothoidNeededBelow(std, c);
  for (const g of curves) {
    const R = g.r;
    if (c.rm != null && R < c.rm - 1e-6) add('error', 'nf.rm', { n: g.n, r: fx(R, 2), rm: fx(c.rm) });
    const d = superelevation(std, c, R);
    if (d === null) { if (c.rnd != null && R < c.rnd) add('info', 'nf.devsee', { n: g.n, r: fx(R, 2), rnd: fx(c.rnd) }); }
    else if (d < 0) add('info', 'nf.crown', { n: g.n, r: fx(R, 2), rnd: fx(c.rnd) });
    else add('info', 'nf.dev', { n: g.n, r: fx(R, 2), d: fx(d, 1) });
    const want = clothoidLength(std, c, R, lanes);
    if (needs !== null && R < needs) {
      if (!(g.ls1 > 0) || !(g.ls2 > 0)) {
        if (want) add('warning', 'nf.clo.need', { n: g.n, r: fx(R, 2), lim: fx(needs), l: fx(want, 1), a: fx(Math.sqrt(want * R), 1) });
        else add('warning', 'nf.clo.needbare', { n: g.n, r: fx(R, 2), lim: fx(needs) });
      } else if (want && Math.min(g.ls1, g.ls2) < want - 0.05) add('warning', 'nf.clo.short', { n: g.n, ls: fx(Math.min(g.ls1, g.ls2), 1), l: fx(want, 1) });
      else if (want) add('info', 'nf.clo.ok', { n: g.n, ls: fx(Math.min(g.ls1, g.ls2), 1), a: fx(Math.sqrt(Math.min(g.ls1, g.ls2) * R), 1), l: fx(want, 1) });
    }
  }
  const ch = std.chaining || {};
  for (let i = 0; i + 1 < curves.length; i++) {
    const a = curves[i], b = curves[i + 1], ratio = ch.ratio ?? 1.5;
    if (ch.rule === 'ratio_both') {
      if (ch.unless_both_above != null && a.r > ch.unless_both_above && b.r > ch.unless_both_above) continue;
      if (!(1 / ratio < a.r / b.r && a.r / b.r < ratio)) add('warning', 'nf.chain.both', { a: a.n, b: b.n, r1: fx(a.r), r2: fx(b.r), lo: fx(1 / ratio, 2), hi: fx(ratio, 2) });
    } else if (ch.rule === 'ratio_next' && c.rnd != null) {
      const lim = (ch.applies_below_factor ?? 1.5) * c.rnd;
      for (const [p, q] of [[a, b], [b, a]]) if (q.r < lim && p.r > ratio * q.r) add('warning', 'nf.chain.next', { a: p.n, b: q.n, r1: fx(p.r), r2: fx(q.r), k: String(ratio) });
    }
  }
  if (prof?.ok) {
    for (const v of prof.curves) {
      const Rv = m(v.type === 'circ' ? v.R : v.L / Math.abs(v.g2 - v.g1)), min = v.kind === 'crest' ? c.crest_min : c.sag_min;
      if (min != null && Rv < min - 0.5) add('error', v.kind === 'crest' ? 'nf.crest' : 'nf.sag', { sta: v.pvi, r: fx(Rv), min: fx(min) });
    }
    prof.grades.forEach((g, i) => { if (c.grade_max != null && Math.abs(g.g) * 100 > c.grade_max + 1e-9) add('warning', 'nf.grade', { n: i + 1, g: fx(g.g * 100, 2), max: fx(c.grade_max) }); });
    prof.pvis.forEach((v, i) => {
      if (i === 0 || i === prof.pvis.length - 1) return;
      const g1 = prof.grades[i - 1].g, g2 = prof.grades[i].g;
      if (Math.abs(g2 - g1) > 1e-9 && !prof.curves.some((q) => q.i === i)) add('warning', 'nf.vbreak', { sta: v.sta });
    });
  }
  return { std, cat, lanes, findings, errors: findings.filter((f) => f.level === 'error').length, warnings: findings.filter((f) => f.level === 'warning').length };
}
