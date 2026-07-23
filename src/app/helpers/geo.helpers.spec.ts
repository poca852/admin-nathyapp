import { normalizeLngLat } from './geo.helpers';

describe('geo.helpers', () => {
  describe('normalizeLngLat', () => {
    it('retorna null para input vacio o incompleto', () => {
      expect(normalizeLngLat(null)).toBeNull();
      expect(normalizeLngLat(undefined)).toBeNull();
      expect(normalizeLngLat([])).toBeNull();
      expect(normalizeLngLat([1])).toBeNull();
      expect(normalizeLngLat([NaN, 14])).toBeNull();
    });

    it('acepta [lng, lat] valido sin swap', () => {
      expect(normalizeLngLat([-90.5, 14.6])).toEqual({
        lng: -90.5,
        lat: 14.6,
        swapped: false,
      });
    });

    it('acepta objeto { lng, lat }', () => {
      expect(normalizeLngLat({ lng: -99.1, lat: 19.4 })).toEqual({
        lng: -99.1,
        lat: 19.4,
        swapped: false,
      });
    });

    it('invierte [lat, lng] cuando el segundo valor no es latitud valida', () => {
      expect(normalizeLngLat([14.6, -100])).toEqual({
        lng: -100,
        lat: 14.6,
        swapped: true,
      });
    });

    it('retorna null si ambos ordenes son invalidos', () => {
      expect(normalizeLngLat([200, 100])).toBeNull();
    });
  });
});
