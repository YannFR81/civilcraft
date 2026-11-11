#!/usr/bin/env node
/* SPDX-License-Identifier: Apache-2.0 */
/**
 * test-civilcraft-standards-fr.mjs — French road design standards (standards-fr.js), DOM-free, in Node.
 *
 *   node bin/test-civilcraft-standards-fr.mjs [--build dev|x.y] [--verbose]
 *
 * By hand, ARP 1994 R80 (Rm 240, Rdm 650, Rnd 900; dévers 7 % → 2.5 % in 1/R; crown −2.5 %): R 400 → 4.146 %;
 * clothoid 6·R^0.4 capped at 67 m on two lanes (R 300 → 58.74 m, R 600 → 67 m), 9·R^0.4 on three; ICTAAL L2 (no law):
 * clothoids under 1.5 × 650 = 975 m, at least R / 9. The step table never gives less than the law and at most 0.5 % more.
 * An alignment with R 200 then R 1,000 (no clothoids) and a profile with a crest of R 2,000 and a 7 % grade: the minimum
 * radius, the clothoids, the chaining, the crest and the grade said; a project in feet; the project file keeps the choice.
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
const EN = JSON.parse(fs.readFileSync(path.join(APP, 'lang/en.json'), 'utf8'));
I18N.init({ strings: EN });
const NF = await mod('standards-fr.js');
const SE = await mod('superelev.js');
const AL = await mod('alignment.js');
const PR = await mod('profile.js');
const PJ = await mod('project.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (VERBOSE) console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Number.isFinite(a) && Math.abs(a - b) <= tol, `${m} (${a} vs ${b}, ±${tol})`);
const section = (s) => console.log('\n== ' + s);

const ARP = NF.STANDARDS.ARP1994, R80 = ARP.categories.R80;
section('ARP 1994 R80 by hand');
{
  near(NF.superelevation(ARP, R80, 240), 7, 1e-12, 'Rm → 7 %');
  near(NF.superelevation(ARP, R80, 650), 2.5, 1e-12, 'Rdm → 2.5 %');
  near(NF.superelevation(ARP, R80, 900), -2.5, 1e-12, 'Rnd → crown kept');
  near(NF.superelevation(ARP, R80, 400), 2.5 + 4.5 * (1 / 400 - 1 / 650) / (1 / 240 - 1 / 650), 1e-12, 'R 400 in 1/R');
  near(NF.superelevation(ARP, R80, 400), 4.146, 0.001, 'R 400 → 4.146 %');
  near(NF.clothoidLength(ARP, R80, 300, 2), 6 * Math.pow(300, 0.4), 1e-9, '6·R^0.4 at R 300');
  near(NF.clothoidLength(ARP, R80, 300, 2), 58.74, 0.01, '= 58.74 m');
  ok(NF.clothoidLength(ARP, R80, 600, 2) === 67, 'capped at 67 m on two lanes');
  near(NF.clothoidLength(ARP, R80, 300, 3), Math.min(100, 9 * Math.pow(300, 0.4)), 1e-9, '9·R^0.4 on three lanes');
  ok(NF.clothoidNeededBelow(ARP, R80) === 900, 'clothoids under Rnd');
}

section('ICTAAL L2 and ICTAVRU U');
{
  const IC = NF.STANDARDS.ICTAAL2015, L2 = IC.categories.L2;
  ok(NF.clothoidNeededBelow(IC, L2) === 975, 'clothoids under 1.5 × Rdn = 975 m');
  ok(NF.superelevation(IC, L2, 500) === null, 'no law given');
  near(NF.clothoidLength(IC, L2, 500), 500 / 9, 1e-9, 'no law: R / 9');
  const VR = NF.STANDARDS.ICTAVRU2009;
  ok(NF.superelevation(VR, VR.categories.U60, 150) === 2.5, 'type U: the top of its range');
  near(NF.clothoidLength(VR, VR.categories.A80, 300), Math.max(14 * (2.5 + 2.5), 300 / 9), 1e-9, 'type A at Rdm: max(14 Δd, R/9)');
}

section('the superelevation step table');
{
  for (const [id, S] of Object.entries(NF.STANDARDS)) for (const [cn, c] of Object.entries(S.categories)) {
    const tbl = NF.rateTable(S, c, 'm');
    if (!tbl) { ok(S.superelevation.law === null || c.rm == null, `${id} ${cn}: no table without a law`); continue; }
    ok(tbl.every((r, i) => i === 0 || r[0] < tbl[i - 1][0]) && tbl[tbl.length - 1][0] === 0, `${id} ${cn}: radii decreasing, down to 0`);
    let worst = 0, under = false;
    for (let R = 20; R <= 3000; R += 1) {
      const law = NF.superelevation(S, c, R), e = SE.rateFor(R, tbl);
      if (law < 0) { if (e !== null) under = true; continue; }
      const d = e * 100 - law;
      if (d < -1e-9) under = true;
      worst = Math.max(worst, d);
    }
    ok(!under && worst <= 0.5 + 1e-9, `${id} ${cn}: never under the law, at most 0.5 % over (${worst.toFixed(3)})`);
  }
  const ft = NF.rateTable(ARP, R80, 'ft');
  near(ft[0][0], 900 / 0.3048, 0.01, 'a project in feet: radii in feet');
}

section('an alignment and a profile checked');
{
  // east, then R 200 to the left, then R 1,000 to the right: no clothoids
  const al = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 400, y: 0, r: 200 }, { x: 700, y: 300 }, { x: 1100, y: 300, r: 1000 }, { x: 1600, y: 0 }] });
  ok(al.ok && al.curves.length === 2, 'two curves');
  const prof = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 135, R: 2000 }, { sta: al.length, z: 120 }]);
  const rep = NF.checkAlignment(al, prof, { std: 'ARP1994', cat: 'R80' }, 'm');
  const has = (key, f = () => true) => rep.findings.some((x) => x.key === key && f(x.args));
  ok(has('nf.rm', (a) => a.n === 1 && a.rm === '240'), 'C-1 under Rm');
  ok(has('nf.clo.need', (a) => a.n === 1), 'C-1 needs clothoids, with a length');
  ok(has('nf.crown', (a) => a.n === 2), 'C-2 (R 1,000 ≥ Rnd 900): crown kept');
  ok(!has('nf.clo.need', (a) => a.n === 2), 'C-2 needs no clothoid');
  ok(has('nf.chain.both', (a) => a.a === 1 && a.b === 2), 'R 200 then R 1,000: ratio outside 1/1.5 to 1.5');
  ok(has('nf.crest', (a) => a.r === '2000' && a.min === '3000'), 'crest R 2,000 under 3,000');
  ok(has('nf.grade', (a) => a.n === 1 && a.g === '7.00'), '7 % grade over 6 %');
  ok(rep.errors === 2 && rep.warnings >= 3, `errors and warnings counted (${rep.errors}, ${rep.warnings})`);
  // every key has an English string
  ok(rep.findings.every((f) => typeof EN[f.key] === 'string'), 'every finding has its string');
  // clothoids long enough: no warning on C-1 at R 260
  const al2 = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 400, y: 0, r: 260, ls1: 70, ls2: 70 }, { x: 700, y: 300 }] });
  const r2 = NF.checkAlignment(al2, null, { std: 'ARP1994', cat: 'R80' }, 'm');
  ok(r2.findings.some((f) => f.key === 'nf.clo.ok') && r2.errors === 0 && r2.warnings === 0, 'R 260 with 70 m clothoids: within the standard');
  const r3 = NF.checkAlignment(AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 400, y: 0, r: 260, ls1: 30, ls2: 30 }, { x: 700, y: 300 }] }), null, { std: 'ARP1994', cat: 'R80' }, 'm');
  ok(r3.findings.some((f) => f.key === 'nf.clo.short'), '30 m clothoids: shorter than recommended');
  // a parabola: its radius at the vertex L / |Δg|
  const pp = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 110, L: 80 }, { sta: 1000, z: 100 }]);   // +2 % → −2 %: R = 80 / 0.04 = 2,000
  ok(NF.checkAlignment(al, pp, { std: 'ARP1994', cat: 'R80' }, 'm').findings.some((f) => f.key === 'nf.crest' && f.args.r === '2000'), 'a parabola: Rv = L / |Δg|');
  ok(NF.checkAlignment(al, PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 110 }, { sta: 1000, z: 100 }]), { std: 'ARP1994', cat: 'R80' }, 'm').findings.some((f) => f.key === 'nf.vbreak'), 'a grade break with no curve');
}

section('feet, untrusted input, the project file');
{
  const alFt = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 1300, y: 0, r: 240 / 0.3048 + 0.01 }, { x: 2300, y: 1000 }] });
  ok(!NF.checkAlignment(alFt, null, { std: 'ARP1994', cat: 'R80' }, 'ft').findings.some((f) => f.key === 'nf.rm'), 'feet: 787.41 ft = 240 m is not under Rm');
  ok(NF.cleanNorm({ std: 'nope' }) === null && NF.cleanNorm(null) === null, 'unknown standard: none');
  ok(JSON.stringify(NF.cleanNorm({ std: 'ARP1994', cat: 'X', lanes: 9 })) === '{"std":"ARP1994","cat":"R60"}', 'unknown category → the first; bad lanes → 2 (not stored)');
  ok(NF.cleanNorm({ std: 'ARP1994', cat: 'T100', lanes: 3 }).lanes === 3, 'three lanes kept');
  const p = new PJ.Project();
  p.change('al', (s) => s.alignments.push({ id: 'a1', name: 'RD 988', start: 0, pis: [{ x: 0, y: 0 }, { x: 1000, y: 0 }], pvis: [], norm: { std: 'ICTAAL2015', cat: 'L2' } }));
  const back = PJ.Project.fromJSON(JSON.parse(JSON.stringify(p.toJSON()))).project;
  ok(JSON.stringify(back.state.alignments[0].norm) === '{"std":"ICTAAL2015","cat":"L2"}', 'the project file keeps the standard and category');
  const p2 = PJ.Project.fromJSON({ ...JSON.parse(JSON.stringify(p.toJSON())), alignments: [{ id: 'a1', name: 'x', pis: [{ x: 0, y: 0 }, { x: 10, y: 0 }], pvis: [], norm: { std: '<script>' } }] }).project;
  ok(!('norm' in p2.state.alignments[0]), 'an unknown standard in a file is dropped');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
