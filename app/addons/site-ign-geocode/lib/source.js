/* SPDX-License-Identifier: Apache-2.0 */
/* i18n-ignore-file: registry data and request text for one open-data service; no sentence a person reads. */
/** The IGN Géoplateforme geocoder (the Base Adresse Nationale, which replaced api-adresse.data.gouv.fr): the best match for a French address. */
export const SOURCE = {
  id: 'geocode-ign', name: 'IGN Géoplateforme address search (France)', licence: 'Licence Ouverte Etalab 2.0 (BAN, IGN)', where: 'https://data.geopf.fr/geocodage/search', kinds: ['point'], needs: 'address',
  request: ({ address }) => ({ url: 'https://data.geopf.fr/geocodage/search?q=' + encodeURIComponent(String(address).trim().slice(0, 200)) + '&limit=1', headers: { Accept: 'application/json' } }),
  parse(text) {
    const j = JSON.parse(text);
    if (!j || j.type !== 'FeatureCollection' || !Array.isArray(j.features)) throw new Error('bad answer');
    const f = j.features[0];
    if (!f) return { info: [{ key: 'nomatch' }] };
    const [lon, lat] = (f.geometry && f.geometry.coordinates) || [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('bad point');
    return { point: { lat, lon, label: String((f.properties && f.properties.label) || '').slice(0, 200) } };
  },
};
