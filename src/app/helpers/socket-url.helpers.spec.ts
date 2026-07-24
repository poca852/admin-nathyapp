import { resolveSocketUrl } from './socket-url.helpers';

describe('resolveSocketUrl', () => {
  it('usa la URL explícita si existe', () => {
    expect(
      resolveSocketUrl('https://ws.example.com', 'https://api.example.com/api'),
    ).toBe('https://ws.example.com');
  });

  it('deriva el socket quitando /api del baseUrl', () => {
    expect(resolveSocketUrl('', 'https://api.example.com/api')).toBe(
      'https://api.example.com',
    );
    expect(resolveSocketUrl(undefined, 'https://api.example.com/api/')).toBe(
      'https://api.example.com',
    );
  });

  it('retorna vacío si no hay fuentes', () => {
    expect(resolveSocketUrl('', '')).toBe('');
    expect(resolveSocketUrl(undefined, undefined)).toBe('');
  });
});
