#!/usr/bin/env node
/* SPDX-License-Identifier: Apache-2.0 */
/**
 * test-civilcraft-vcircle.mjs — circular vertical curves (profile.js { R }), the French practice: a radius at a PVI,
 * DOM-free, in Node.
 *
 *   node bin/test-civilcraft-vcircle.mjs [--build dev|x.y] [--verbose]
 *
 * By hand: a sag from −2 % to +3 % with R = 5,000 m and a crest from +4 % to −3 % with R = 3,000 m. Tangent length
 * T = R·tan(|θ2 − θ1| / 2), BVC = PVI − T·cos θ1, EVC = PVI + T·cos θ2; every point at R from the centre; the grades at
 * BVC and EVC are the tangents'; the low and high points; the parabola of the same R (K = R / 100) within a few
 * millimetres; the "why" for a radius too large (the largest whole radius fits, one more does not); LandXML CircCurve
 * out and back (radius kept; a CircCurve with a length and no radius gives the radius); the project file keeps R.
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
const PR = await mod('profile.js');
const WHY = await mod('solve-why.js');
const LX = await mod('landxml.js');
const AL = await mod('alignment.js');
const PJ = await mod('project.js');
const IM = await mod('ifc-civil-model.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; if (VERBOSE) console.log('  ok   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const near = (a, b, tol, m) => ok(Number.isFinite(a) && Math.abs(a - b) <= tol, `${m} (${a} vs ${b}, ±${tol})`);
const section = (s) => console.log('\n== ' + s);

section('a sag by hand: −2 % → +3 %, R 5,000');
{
  const p = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 90, R: 5000 }, { sta: 1000, z: 105 }]);
  ok(p.ok && p.curves.length === 1, 'one curve, no error');
  const c = p.curves[0], th1 = Math.atan(-0.02), th2 = Math.atan(0.03), T = 5000 * Math.tan((th2 - th1) / 2);
  ok(c.type === 'circ' && c.kind === 'sag' && c.R === 5000, 'circular, sag, R kept');
  near(c.T, T, 1e-9, 'T = R·tan(|Δθ|/2)');
  near(c.bvc, 500 - T * Math.cos(th1), 1e-9, 'BVC = PVI − T·cos θ1');
  near(c.evc, 500 + T * Math.cos(th2), 1e-9, 'EVC = PVI + T·cos θ2');
  near(p.elevationAt(c.bvc), 90 - T * Math.sin(th1), 1e-9, 'BVC on the back grade');
  near(p.elevationAt(c.evc), 90 + T * Math.sin(th2), 1e-9, 'EVC on the ahead grade');
  near(p.gradeAt(c.bvc), -0.02, 1e-9, 'grade at BVC = g1 (tangent)');
  near(p.gradeAt(c.evc), 0.03, 1e-9, 'grade at EVC = g2 (tangent)');
  let worst = 0;
  for (let k = 0; k <= 50; k++) { const s = c.bvc + (c.L * k) / 50, d = Math.hypot(s - c.xc, p.elevationAt(s) - c.zc); worst = Math.max(worst, Math.abs(d - 5000)); }
  ok(worst < 1e-6, `every point at R from the centre (worst ${worst.toExponential(1)} m)`);
  ok(c.low && Math.abs(c.low.sta - c.xc) < 1e-9 && Math.abs(p.gradeAt(c.low.sta)) < 1e-9 && near.length, 'the low point is where the grade is 0');
  ok(p.elevationAt(c.low.sta) <= p.elevationAt(c.low.sta - 1) && p.elevationAt(c.low.sta) <= p.elevationAt(c.low.sta + 1), 'and it is the lowest');
  near(c.K, c.L / 5, 1e-9, 'K = L / |A|');
  // the parabola of the same radius (K = R / 100): the French "raccordement parabolique" — a few millimetres apart
  const q = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 90, K: 50 }, { sta: 1000, z: 105 }]);
  let dz = 0;
  for (let s = 380; s <= 620; s += 1) dz = Math.max(dz, Math.abs(p.elevationAt(s) - q.elevationAt(s)));
  ok(dz < 0.005, `the parabola with K = R/100 stays within 5 mm (${(dz * 1000).toFixed(2)} mm)`);
}

section('a crest by hand: +4 % → −3 %, R 3,000');
{
  const p = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 400, z: 116, R: 3000 }, { sta: 800, z: 104 }]);
  const c = p.curves[0];
  ok(p.ok && c.type === 'circ' && c.kind === 'crest', 'circular crest, no error');
  near(p.gradeAt(c.bvc), 0.04, 1e-9, 'grade at BVC = +4 %');
  near(p.gradeAt(c.evc), -0.03, 1e-9, 'grade at EVC = −3 %');
  near(p.gradeAt((c.bvc + c.evc) / 2) * 0, 0, 0, 'grade defined mid curve');
  ok(c.high && Math.abs(p.gradeAt(c.high.sta)) < 1e-9 && p.elevationAt(c.high.sta) >= p.elevationAt(c.high.sta + 2), 'the high point, the highest');
  ok(p.elevationAt(400) < 116 && p.elevationAt(c.bvc + 1) < 116, 'the curve passes under the PVI');
  // the IFC model goes out as the parabola with the same ends and end grades: how far apart, at road radii
  const al = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 800, y: 0 }] });
  const segs = IM.verticalSegments(p, al), arc = segs.find((s) => s.type === 'PARABOLICARC');
  let dz = 0;
  for (let k = 0; k <= 40; k++) { const x = (arc.len * k) / 40, zp = arc.z0 + arc.g0 * x + ((arc.g1 - arc.g0) * x * x) / (2 * arc.len); dz = Math.max(dz, Math.abs(zp - p.elevationAt(arc.sta + x))); }
  ok(dz < 0.005, `IFC: the parabola written for the circle stays within 5 mm (${(dz * 1000).toFixed(2)} mm)`);
}

section('L and K still work; R wins');
{
  const a = PR.buildProfile([{ sta: 0, z: 0 }, { sta: 100, z: 1, L: 40 }, { sta: 200, z: 0 }]);
  const b = PR.buildProfile([{ sta: 0, z: 0 }, { sta: 100, z: 1, L: 40, R: 5000 }, { sta: 200, z: 0 }]);
  ok(a.curves[0].type === undefined && a.curves[0].L === 40, 'a parabola as before');
  ok(b.curves[0].type === 'circ' && Math.abs(b.curves[0].L - 40) > 1, 'R at the same PVI makes it circular');
  ok(PR.buildProfile([{ sta: 0, z: 0 }, { sta: 100, z: 1, R: 3000 }, { sta: 200, z: 2 }]).curves.length === 0, 'no grade change, no curve');
}

section('why: a radius too large');
{
  const pv = [{ sta: 0, z: 100 }, { sta: 100, z: 104, R: 4000 }, { sta: 200, z: 101 }];   // +4 % → −3 %: T ≈ 140 m, only 100 m each side
  ok(!PR.buildProfile(pv).ok, 'the profile says it does not fit');
  const w = WHY.verticalWhy(pv);
  ok(w.length === 1 && w[0].R === 4000 && w[0].fixR > 0 && w[0].fix === null, `one why, with a radius that fits (${w[0]?.fixR})`);
  const fit = PR.buildProfile(pv.map((v, i) => (i === 1 ? { ...v, R: w[0].fixR } : v)));
  const over = PR.buildProfile(pv.map((v, i) => (i === 1 ? { ...v, R: w[0].fixR + 1 } : v)));
  ok(fit.ok && !over.ok, 'that radius fits; one metre more does not');
  ok(WHY.verticalWhy(pv.map((v, i) => (i === 1 ? { ...v, R: 1000 } : v))).length === 0, 'a radius that fits: nothing to say');
}

section('LandXML CircCurve');
{
  const al = AL.buildAlignment({ pis: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] });
  const prof = PR.buildProfile([{ sta: 0, z: 100 }, { sta: 500, z: 90, R: 5000 }, { sta: 1000, z: 105 }]);
  const xml = LX.writeLandXml({ name: 'VC', units: 'm', alignments: [{ name: 'Axe 1', alignment: al, eg: null, profile: { name: 'Projet', profile: prof } }] });
  ok(/<CircCurve length="[\d.]+" radius="5000">500 90<\/CircCurve>/.test(xml), 'written as CircCurve with its radius');
  const back = LX.readLandXml(xml).alignments[0].profiles[0].pvis;
  ok(back[1].R === 5000, 'read back: R 5,000');
  const p2 = PR.buildProfile(back);
  near(p2.elevationAt(520), prof.elevationAt(520), 1e-9, 'the same curve after the trip');
  // a file with a length and no radius (arc length = R · Δθ)
  const dth = Math.atan(0.03) - Math.atan(-0.02);
  const xml2 = xml.replace(/<CircCurve length="[\d.]+" radius="5000">/, `<CircCurve length="${(5000 * dth).toFixed(6)}">`);
  const r2 = LX.readLandXml(xml2).alignments[0].profiles[0].pvis;
  near(r2[1].R, 5000, 1e-3, 'length only: the radius from the length');
  ok(!('Lc' in r2[1]), 'no working field left behind');
  const xml3 = xml.replace(/<CircCurve length="[\d.]+" radius="5000">500 90<\/CircCurve>/, '<UnsymParaCurve lengthIn="40" lengthOut="60">500 90</UnsymParaCurve>');
  const r3 = LX.readLandXml(xml3);
  ok(r3.alignments[0].profiles[0].pvis[1].L === 0 && JSON.stringify(r3).includes('Unsymmetrical'), 'unsymmetrical: kept as a PVI, with a note');
}

section('the project file');
{
  const p = new PJ.Project();
  p.change('al', (s) => s.alignments.push({ id: 'a1', name: 'Axe', start: 0, pis: [{ x: 0, y: 0 }, { x: 1000, y: 0 }], pvis: [{ sta: 0, z: 100, L: 0 }, { sta: 500, z: 90, L: 0, R: 5000 }, { sta: 1000, z: 105, L: 0 }] }));
  const back = PJ.Project.fromJSON(JSON.parse(JSON.stringify(p.toJSON()))).project;
  ok(back.state.alignments[0].pvis[1].R === 5000, 'R kept in the project file');
  ok(back.designProfile(back.state.alignments[0]).curves[0].type === 'circ', 'and the design profile is circular');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
