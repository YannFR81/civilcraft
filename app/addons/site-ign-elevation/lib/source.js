/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** The IGN Géoplateforme elevation service (RGE ALTI): the ground elevation at one point, metres (NGF-IGN69 in mainland France). */
export const SOURCE = {
  id: 'ign-alti', name: 'IGN ground elevation (RGE ALTI, France)', licence: 'Licence Ouverte Etalab 2.0 (IGN)', where: 'https://data.geopf.fr/altimetrie/', kinds: ['elevation'], needs: 'point',
  request: ({ lat, lon }) => ({ url: 'https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?lon=' + lon.toFixed(7) + '&lat=' + lat.toFixed(7) + '&resource=ign_rge_alti_wld&zonly=true' }),
  parse(text) {
    const j = JSON.parse(text), v = Number(j && Array.isArray(j.elevations) ? j.elevations[0] : NaN);
    if (!Number.isFinite(v) || v < -1000) return { info: [{ key: 'noelev' }] };   // the service answers -99999 where it has no data
    return { info: [{ key: 'elevation', value: Math.round(v * 100) / 100 }] };
  },
};
