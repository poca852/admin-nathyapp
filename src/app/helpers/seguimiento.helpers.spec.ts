import {
  colorForCobrador,
  colorForKey,
  filterPagosByRutaId,
  resolveRutaMeta,
  resolveSelectedRutaId,
  toggleSelectedCobradorId,
} from './seguimiento.helpers';

describe('seguimiento.helpers', () => {
  const cobradores = [
    { cobradorId: 'c1', nombre: 'Ana', rutaId: 'r1' },
    { cobradorId: 'c2', nombre: 'Luis', rutaId: 'r2' },
  ];

  const rutas = [
    { id: 'r1', nombre: 'Centro' },
    { _id: 'r2', nombre: 'Norte' },
  ];

  describe('colorForKey / colorForCobrador', () => {
    it('es estable para el mismo id', () => {
      expect(colorForKey('c1')).toBe(colorForKey('c1'));
      expect(colorForCobrador('c1')).toBe(colorForKey('c1'));
    });

    it('diferencia cobradores distintos', () => {
      expect(colorForCobrador('c1')).not.toBe(colorForCobrador('c2'));
    });

    it('devuelve hsl', () => {
      expect(colorForKey('ruta-x')).toMatch(/^hsl\(\d+ \d+% \d+%\)$/);
    });
  });

  describe('resolveSelectedRutaId', () => {
    it('retorna null sin seleccion', () => {
      expect(resolveSelectedRutaId(null, cobradores)).toBeNull();
    });

    it('retorna ruta del cobrador seleccionado', () => {
      expect(resolveSelectedRutaId('c2', cobradores)).toBe('r2');
    });
  });

  describe('filterPagosByRutaId', () => {
    const pagos = [
      { id: 'p1', rutaId: 'r1' },
      { id: 'p2', rutaId: 'r2' },
      { id: 'p3', rutaId: 'r1' },
    ];

    it('sin filtro retorna todos', () => {
      expect(filterPagosByRutaId(pagos, null)).toEqual(pagos);
    });

    it('filtra por ruta', () => {
      expect(filterPagosByRutaId(pagos, 'r1').map((p) => p.id)).toEqual([
        'p1',
        'p3',
      ]);
    });
  });

  describe('toggleSelectedCobradorId', () => {
    it('selecciona al primer clic', () => {
      expect(toggleSelectedCobradorId(null, 'c1')).toBe('c1');
    });

    it('limpia al segundo clic sobre el mismo', () => {
      expect(toggleSelectedCobradorId('c1', 'c1')).toBeNull();
    });

    it('cambia a otro cobrador', () => {
      expect(toggleSelectedCobradorId('c1', 'c2')).toBe('c2');
    });
  });

  describe('resolveRutaMeta', () => {
    it('usa color del cobrador de esa ruta', () => {
      const meta = resolveRutaMeta('r1', cobradores, rutas);
      expect(meta.color).toBe(colorForCobrador('c1'));
      expect(meta.rutaNombre).toBe('Centro');
      expect(meta.cobradorNombre).toBe('Ana');
    });

    it('fallback de color por rutaId si no hay cobrador', () => {
      const meta = resolveRutaMeta('r99', [], rutas);
      expect(meta.color).toBe(colorForKey('r99'));
      expect(meta.cobradorNombre).toBeUndefined();
    });

    it('sin rutaId usa color sin-ruta', () => {
      expect(resolveRutaMeta(undefined, cobradores, rutas).color).toBe(
        colorForKey('sin-ruta'),
      );
    });
  });
});
