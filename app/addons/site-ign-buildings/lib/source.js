/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** IGN BD TOPO buildings (BDTOPO_V3:batiment) through the Géoplateforme WFS → polygons with height, floors and use. */
import { wfsUrl, polygonsOf } from './wfs.js';
export const SOURCE = {
  id: 'ign-bdtopo-buildings', name: 'IGN BD TOPO buildings (France)', licence: 'Licence Ouverte Etalab 2.0 (IGN)', where: 'https://data.geopf.fr/wfs/ows (BDTOPO_V3:batiment)', kinds: ['buildings'], needs: 'point',
  request: (ctx) => ({ url: wfsUrl('BDTOPO_V3:batiment', ctx) }),
  parse(text) {
    const j = JSON.parse(text);
    if (!j || j.type !== 'FeatureCollection') throw new Error('not geojson');
    const features = polygonsOf(j, (p) => ({ building: p.usage_1 ?? p.nature ?? 'yes', height: Number.isFinite(p.hauteur) ? p.hauteur : null, 'building:levels': Number.isFinite(p.nombre_d_etages) ? p.nombre_d_etages : null, name: null }));
    return { geojson: JSON.stringify({ type: 'FeatureCollection', features }), kind: 'buildings', name: 'IGN BD TOPO buildings' };
  },
};
