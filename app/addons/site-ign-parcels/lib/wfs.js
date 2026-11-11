/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** A WFS 2.0 GetFeature on the IGN Géoplateforme around the point, GeoJSON in WGS 84 (EPSG:4326 urn: latitude first in BBOX). */
export function wfsUrl(typeName, { lat, lon, radius = 150, count = 400 }) {
  const dLat = radius / 111320, dLon = radius / (111320 * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  const bb = [lat - dLat, lon - dLon, lat + dLat, lon + dLon].map((v) => v.toFixed(6)).join(',');
  return 'https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=' + encodeURIComponent(typeName) + '&OUTPUTFORMAT=application%2Fjson&SRSNAME=EPSG%3A4326&COUNT=' + count + '&BBOX=' + bb + ',urn:ogc:def:crs:EPSG::4326';
}
/** Polygons and multipolygons → one 2D polygon feature each (BD TOPO carries a Z on every vertex). */
export function polygonsOf(fc, props) {
  const out = [];
  const flat = (ring) => ring.map((p) => [Number(p[0]), Number(p[1])]);
  for (const f of fc.features || []) {
    const g = f && f.geometry; if (!g) continue;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const p of polys) if (Array.isArray(p) && p.length && p[0].length >= 4) out.push({ type: 'Feature', properties: props(f.properties || {}), geometry: { type: 'Polygon', coordinates: p.map(flat) } });
  }
  return out;
}
