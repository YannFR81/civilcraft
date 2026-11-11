#!/usr/bin/env node
/* SPDX-License-Identifier: Apache-2.0 */
/**
 * test-civilcraft-ign.mjs — French open data (IGN Géoplateforme): the five Address to site add-ons (addons/site-ign-*,
 * site-gpu-zoning), the French field names in site-sources.js, and the one-click IGN map layers (basemap.js), DOM-free.
 * NO live network: the answers are real ones recorded at Albi (81) on 2026-11-12, cut to one feature (the zone's outline
 * replaced by a square around the point), handed to a fake fetch.
 *   node bin/test-civilcraft-ign.mjs [--build dev]
 */
import fs from 'node:fs';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const APP = path.join(REPO, 'public_html/assets/apps/civilcraft', arg('--build') || 'dev');
const manifest = JSON.parse(fs.readFileSync(path.join(APP, 'manifest.json'), 'utf8'));
registerHooks({ resolve(spec, ctx, next) { const m = manifest.imports?.[spec]; if (m && spec !== 'three') return { url: pathToFileURL(path.join(REPO, 'public_html', m)).href, shortCircuit: true }; return next(spec, ctx); } });
const mod = (f) => import(pathToFileURL(path.join(APP, f)).href);
(await mod('i18n.js')).init({ strings: JSON.parse(fs.readFileSync(path.join(APP, 'lang/en.json'), 'utf8')) });
const F = await mod('site-fetch.js'), S = await mod('site-sources.js'), B = await mod('basemap.js'), { readGeoJSON } = await mod('geojson.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };

const BAT = "{\"type\": \"FeatureCollection\", \"features\": [{\"type\": \"Feature\", \"id\": \"batiment.7025964\", \"geometry\": {\"type\": \"MultiPolygon\", \"coordinates\": [[[[2.14738173, 43.92901648, 181.7], [2.14745382, 43.92902605, 181.7], [2.14747379, 43.9289398, 181.7], [2.1474897, 43.92887513, 181.7], [2.14742512, 43.92886292, 181.7], [2.14741721, 43.92889256, 181.7], [2.14738173, 43.92901648, 181.7]]]]}, \"properties\": {\"nature\": \"Indifférenciée\", \"usage_1\": \"Commercial et services\", \"nombre_d_etages\": 1, \"hauteur\": 8, \"altitude_minimale_sol\": 173.6, \"altitude_maximale_toit\": 188.9}}]}";
const PAR = "{\"type\": \"FeatureCollection\", \"features\": [{\"type\": \"Feature\", \"id\": \"parcelle.17182732\", \"geometry\": {\"type\": \"MultiPolygon\", \"coordinates\": [[[[2.14692566, 43.92791987], [2.14689131, 43.92794354], [2.14686398, 43.92796421], [2.14656278, 43.92817804], [2.1465613, 43.92817703], [2.14646767, 43.92824281], [2.1464668, 43.9282924], [2.14645971, 43.92829216], [2.14645794, 43.92836019], [2.14646492, 43.92836024], [2.14646397, 43.92840685], [2.14673223, 43.9284886], [2.14674947, 43.92849342], [2.14686918, 43.92852432], [2.14687228, 43.92852488], [2.14687464, 43.92852562], [2.14687774, 43.92852628], [2.14688009, 43.92852702], [2.1468832, 43.92852758], [2.1468863, 43.92852832], [2.14688853, 43.92852906], [2.14689164, 43.92852963], [2.14689399, 43.92853036], [2.14689709, 43.92853102], [2.1469002, 43.92853158], [2.14690255, 43.92853232], [2.14690566, 43.92853289], [2.14690802, 43.92853353], [2.14691112, 43.9285341], [2.14691422, 43.92853484], [2.14691646, 43.9285354], [2.14691968, 43.92853614], [2.14692279, 43.92853671], [2.14692515, 43.92853718], [2.14692751, 43.92853765], [2.14692986, 43.9285382], [2.14693297, 43.92853868], [2.1469352, 43.92853924], [2.14693756, 43.9285397], [2.14693992, 43.92854017], [2.14694228, 43.92854064], [2.14694538, 43.92854121], [2.14694762, 43.92854167], [2.14694998, 43.92854223], [2.14695234, 43.9285427], [2.1469547, 43.92854299], [2.1469578, 43.92854364], [2.14696004, 43.92854402], [2.1469624, 43.92854449], [2.14696475, 43.92854505], [2.14696711, 43.92854552], [2.14697022, 43.92854599], [2.14697245, 43.92854646], [2.14708076, 43.92856566], [2.14730719, 43.92860505], [2.14754442, 43.92864668], [2.14755225, 43.92861398], [2.14763276, 43.92827612], [2.14772589, 43.92788543], [2.14764819, 43.92787664], [2.1476402, 43.92791158], [2.14761135, 43.92790893], [2.14759394, 43.92799069], [2.14751687, 43.92801457], [2.14737264, 43.92805818], [2.14736949, 43.92805239], [2.14726449, 43.92807893], [2.14722082, 43.9280848], [2.14721305, 43.92807106], [2.14716701, 43.92808555], [2.14716321, 43.92808156], [2.14707982, 43.92811196], [2.14707518, 43.92811364], [2.14704562, 43.92807561], [2.14698063, 43.9279914], [2.14692566, 43.92791987]]]]}, \"properties\": {\"idu\": \"81004000AE0141\", \"numero\": \"0141\", \"section\": \"AE\", \"code_dep\": \"81\", \"nom_com\": \"Albi\", \"code_insee\": \"81004\", \"contenance\": 5159}}]}";
const ZON = "{\"type\": \"FeatureCollection\", \"features\": [{\"type\": \"Feature\", \"id\": \"zone_urba.3426107\", \"geometry\": {\"type\": \"MultiPolygon\", \"coordinates\": [[[[2.146, 43.927], [2.149, 43.927], [2.149, 43.93], [2.146, 43.93], [2.146, 43.927]]]]}, \"properties\": {\"libelle\": \"UIC5\", \"libelong\": \"Zone: UIC5, H: NR, EB: NR, EV: NR\", \"typezone\": \"U\", \"idurba\": \"248100737_PLUi_20251208\"}}]}";

const AD = ['site-ign-geocode', 'site-ign-elevation', 'site-ign-buildings', 'site-ign-parcels', 'site-gpu-zoning'];
const SRC = {};
const index = JSON.parse(fs.readFileSync(path.join(APP, 'addons/index.json'), 'utf8')).addons;
for (const id of AD) {
  const m = JSON.parse(fs.readFileSync(path.join(APP, 'addons', id, 'addon.json'), 'utf8'));
  ok(m.id === id && m.default === 'off' && m.apps.includes('civilcraft') && m.api && m.permissions.includes('network'), id + ': manifest, off by default');
  ok(index.includes(id), id + ': in the bundled list');
  ok(/only when you press/.test(m.description) && /France/.test(m.description) && /Etalab|open data/.test(m.description), id + ': says it asks only on a press, France, the licence');
  ok(!/fetch\(/.test(fs.readFileSync(path.join(APP, 'addons', id, 'main.js'), 'utf8')), id + ': main.js never fetches');
  const fr = JSON.parse(fs.readFileSync(path.join(APP, 'addons', id, 'lang/fr.json'), 'utf8')), en = JSON.parse(fs.readFileSync(path.join(APP, 'addons', id, 'lang/en.json'), 'utf8'));
  ok(en[id + '.name'] && fr[id + '.name'] && fr[id + '.name'] !== en[id + '.name'], id + ': name in English and French');
  SRC[id] = (await mod(`addons/${id}/lib/source.js`)).SOURCE;
  ok(SRC[id].id && SRC[id].licence && SRC[id].where && SRC[id].needs, id + ': source states licence, where, needs');
}
let calls = [];
const fake = (answers) => async (url, init) => { calls.push({ url, init }); const a = answers(url, init); return { ok: a.status ? a.status < 400 : true, status: a.status || 200, text: async () => a.body }; };
const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const lat = 43.9286, lon = 2.1474;   // Albi, by the cathedral

// geocoder (BAN through the Géoplateforme)
let r = await F.runSource(SRC['site-ign-geocode'], { address: '1 place Sainte-Cécile, Albi' }, { fetchFn: fake(() => ({ body: JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [2.14275, 43.92866] }, properties: { label: '1 Place Sainte-Cécile 81000 Albi', score: 0.97 } }] }) })), store: store() });
ok(r.ok && Math.abs(r.result.point.lat - 43.92866) < 1e-9 && Math.abs(r.result.point.lon - 2.14275) < 1e-9 && /Albi/.test(r.result.point.label), 'geocode: point read (GeoJSON lon, lat)');
ok(calls[0].url === 'https://data.geopf.fr/geocodage/search?q=1%20place%20Sainte-C%C3%A9cile%2C%20Albi&limit=1' && calls[0].init.credentials === 'omit', 'geocode: the Géoplateforme, address URL-encoded, one result, no credentials');
r = await F.runSource(SRC['site-ign-geocode'], { address: 'zzzz' }, { fetchFn: fake(() => ({ body: '{"type":"FeatureCollection","features":[]}' })), store: store() }); ok(r.ok && r.result.info[0].key === 'nomatch', 'geocode: no match said');
r = await F.runSource(SRC['site-ign-geocode'], { address: 'x' }, { fetchFn: fake(() => ({ body: '{"message":"The upstream server is timing out"}' })), store: store() }); ok(!r.ok && r.why === 'parse', 'geocode: the gateway timeout body is a failure, not a point');

// elevation (RGE ALTI)
calls = [];
r = await F.runSource(SRC['site-ign-elevation'], { lat, lon }, { fetchFn: fake(() => ({ body: '{"elevations": [174.17]}' })), store: store() });
ok(r.ok && r.result.info[0].key === 'elevation' && r.result.info[0].value === 174.17, 'alti: 174.17 m read');
ok(/^https:\/\/data\.geopf\.fr\/altimetrie\/1\.0\/calcul\/alti\/rest\/elevation\.json\?lon=2\.1474000&lat=43\.9286000&resource=ign_rge_alti_wld&zonly=true$/.test(calls[0].url), 'alti: lon then lat, RGE ALTI resource, z only');
r = await F.runSource(SRC['site-ign-elevation'], { lat, lon }, { fetchFn: fake(() => ({ body: '{"elevations": [-99999]}' })), store: store() }); ok(r.result.info[0].key === 'noelev', 'alti: the no-data value said, not shown as a height');

// WFS: bounding box latitude first (EPSG:4326 urn), GeoJSON in WGS 84
calls = [];
r = await F.runSource(SRC['site-ign-buildings'], { lat, lon, radius: 150 }, { fetchFn: fake(() => ({ body: BAT })), store: store() });
const u = new URL(calls[0].url), bb = (u.searchParams.get('BBOX') || '').split(',');
ok(u.origin + u.pathname === 'https://data.geopf.fr/wfs/ows' && u.searchParams.get('TYPENAMES') === 'BDTOPO_V3:batiment' && u.searchParams.get('OUTPUTFORMAT') === 'application/json' && u.searchParams.get('SRSNAME') === 'EPSG:4326', 'buildings: the BD TOPO WFS, GeoJSON, WGS 84');
ok(Number(bb[0]) < lat && Number(bb[2]) > lat && Number(bb[1]) < lon && Number(bb[3]) > lon && Math.abs(Number(bb[2]) - Number(bb[0]) - 300 / 111320) < 1e-5 && bb[4] === 'urn:ogc:def:crs:EPSG::4326', 'buildings: box latitude first, 150 m each side');
const bl = readGeoJSON(r.result.geojson, r.result.name).layers[0];
ok(r.result.kind === 'buildings' && JSON.parse(r.result.geojson).features.every((f) => f.geometry.type === 'Polygon' && f.geometry.coordinates[0].every((p) => p.length === 2)), 'buildings: polygons, the BD TOPO Z dropped');
const s1 = S.siteAt([{ kind: 'buildings', layer: bl }], { x: lon, y: lat, radius: 150, geographic: true });
ok(s1.buildings.length === 1 && s1.buildings[0].record.height === 8 && s1.buildings[0].record.levels === 1 && s1.buildings[0].record.kind === 'Commercial et services', 'buildings: height 8 m, 1 floor, use reach siteAt');

r = await F.runSource(SRC['site-ign-parcels'], { lat, lon, radius: 150 }, { fetchFn: fake(() => ({ body: PAR })), store: store() });
ok(new URL(calls[1].url).searchParams.get('TYPENAMES') === 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle', 'parcels: the PCI Express WFS');
const pl = readGeoJSON(r.result.geojson, r.result.name).layers[0], ring = JSON.parse(r.result.geojson).features[0].geometry.coordinates[0];
const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cy = ring.reduce((s, p) => s + p[1], 0) / ring.length;
const s2 = S.siteAt([{ kind: 'parcels', layer: pl }], { x: cx, y: cy, radius: 150, geographic: true });
ok(s2.parcel?.record.id === '81004000AE0141' && s2.parcel.claimedArea === 5159, 'parcels: the IDU and the area (contenance, m²) reach siteAt');

r = await F.runSource(SRC['site-gpu-zoning'], { lat, lon, radius: 150 }, { fetchFn: fake(() => ({ body: ZON })), store: store() });
ok(new URL(calls[2].url).searchParams.get('TYPENAMES') === 'wfs_du:zone_urba' && new URL(calls[2].url).searchParams.get('COUNT') === '200', 'zoning: the GPU WFS, at most 200 zones');
const zl = readGeoJSON(r.result.geojson, r.result.name).layers[0];
const s3 = S.siteAt([{ kind: 'zoning', layer: zl }], { x: lon, y: lat, radius: 150, geographic: true });
ok(s3.zoning.length === 1 && s3.zoning[0].code === 'UIC5' && /UIC5/.test(s3.zoning[0].desc), 'zoning: the PLUi zone UIC5 reaches siteAt');
r = await F.runSource(SRC['site-gpu-zoning'], { lat, lon }, { fetchFn: fake(() => ({ body: '<ows:ExceptionReport/>' })), store: store() }); ok(!r.ok && r.why === 'parse', 'zoning: a WFS exception is a parse failure');

// French field names, read from files too (a BD TOPO GeoPackage, a cadastre export)
ok(S.mapFeature('buildings', { hauteur: 12.5, nombre_d_etages: 3, usage_1: 'Résidentiel' }).height === 12.5 && S.mapFeature('buildings', { nombre_d_etages: 3 }).levels === 3, 'names: hauteur, nombre_d_etages');
ok(S.mapFeature('parcels', { idu: '81004000AE0141', contenance: 5159 }).id === '81004000AE0141', 'names: idu');
ok(S.mapFeature('zoning', { libelle: 'N', libelong: 'Zone naturelle' }).desc === 'Zone naturelle', 'names: libelle, libelong');
ok(S.guessKind({ geom: 'pg', fields: ['hauteur', 'nombre_d_etages', 'usage_1'] })?.kind === 'buildings', 'a BD TOPO layer is recognised as buildings');
ok(['ign-bdtopo-buildings', 'ign-cadastre', 'gpu-zoning', 'ign-rgealti'].every((id) => S.SOURCES.some((s) => s.id === id && s.region === 'FR')), 'the French sources are listed');

// one-click IGN map layers
for (const L of B.IGN_LAYERS) {
  const f = B.ignLayer(L.id), g = B.readGrid(f.grid);
  ok(f.kind === 'wmts' && f.url === 'https://data.geopf.fr/wmts' && f.set === 'PM' && /Etalab/.test(f.attribution), L.id + ': a WMTS record on PM');
  ok(g.matrices.length === L.maxZ + 1 && g.matrices[L.maxZ].id === String(L.maxZ), L.id + ': levels 0 to ' + L.maxZ + ' only (deeper ones are 404)');
}
const ortho = B.ignLayer('ign-ortho'), tu = new URL(B.wmtsTileUrl({ kvp: ortho.url, layer: ortho.layer, style: ortho.style, format: ortho.format, set: ortho.set, matrix: '19', row: 191853, col: 265200 }));
ok(tu.searchParams.get('LAYER') === 'ORTHOIMAGERY.ORTHOPHOTOS' && tu.searchParams.get('FORMAT') === 'image/jpeg' && tu.searchParams.get('TILEMATRIXSET') === 'PM' && tu.searchParams.get('TILEMATRIX') === '19', 'ortho: the GetTile request');
ok(new URL(B.wmtsTileUrl({ kvp: B.IGN_WMTS, layer: 'x', style: B.ignLayer('ign-cadastre').style, set: 'PM', matrix: '0', row: 0, col: 0 })).searchParams.get('STYLE') === 'PCI vecteur', 'cadastre: its style');
ok(B.ignLayer('nope') === null, 'an unknown layer: none');

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
