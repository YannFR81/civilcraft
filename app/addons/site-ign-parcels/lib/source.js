/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** French cadastral parcels, IGN Parcellaire Express (CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle), through the Géoplateforme WFS. */
import { wfsUrl, polygonsOf } from './wfs.js';
export const SOURCE = {
  id: 'ign-cadastre', name: 'IGN cadastral parcels, PCI Express (France)', licence: 'Licence Ouverte Etalab 2.0 (IGN, DGFiP)', where: 'https://data.geopf.fr/wfs/ows (CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle)', kinds: ['parcels'], needs: 'point',
  request: (ctx) => ({ url: wfsUrl('CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle', ctx) }),
  parse(text) {
    const j = JSON.parse(text);
    if (!j || j.type !== 'FeatureCollection') throw new Error('not geojson');
    // idu = département + commune + préfixe + section + numéro (14 characters); contenance = area in m²
    const features = polygonsOf(j, (p) => ({ idu: p.idu ?? null, section: p.section ?? null, numero: p.numero ?? null, nom_com: p.nom_com ?? null, contenance: Number.isFinite(p.contenance) ? p.contenance : null }));
    return { geojson: JSON.stringify({ type: 'FeatureCollection', features }), kind: 'parcels', name: 'IGN cadastral parcels' };
  },
};
