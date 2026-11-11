/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** PLU / PLUi zones from the Géoportail de l'Urbanisme (wfs_du:zone_urba) through the Géoplateforme WFS: the zone label and its long label. */
import { wfsUrl, polygonsOf } from './wfs.js';
export const SOURCE = {
  id: 'gpu-zoning', name: "Géoportail de l'Urbanisme zones, PLU / PLUi (France)", licence: 'Open data (Géoportail de l\'Urbanisme); check the plan in force with the commune', where: 'https://data.geopf.fr/wfs/ows (wfs_du:zone_urba)', kinds: ['zoning'], needs: 'point',
  request: (ctx) => ({ url: wfsUrl('wfs_du:zone_urba', { ...ctx, count: 200 }) }),
  parse(text) {
    const j = JSON.parse(text);
    if (!j || j.type !== 'FeatureCollection') throw new Error('not geojson');
    const features = polygonsOf(j, (p) => ({ libelle: p.libelle ?? null, libelong: p.libelong ?? null, typezone: p.typezone ?? null, idurba: p.idurba ?? null }));
    return { geojson: JSON.stringify({ type: 'FeatureCollection', features }), kind: 'zoning', name: 'PLU zones' };
  },
};
