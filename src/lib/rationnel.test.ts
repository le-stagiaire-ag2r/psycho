import { describe, expect, it } from 'vitest';
import { add, div, egal, formater, formatable, mul, q, sub } from './rationnel';

describe('rationnels exacts', () => {
  it('normalise et calcule sans erreur de virgule', () => {
    expect(q(6, 8)).toEqual({ n: 3, d: 4 });
    expect(q(1, -2)).toEqual({ n: -1, d: 2 });
    // 0,1 + 0,2 vaut exactement 0,3 (pas 0,30000000000000004)
    expect(egal(add(q(1, 10), q(2, 10)), q(3, 10))).toBe(true);
    expect(egal(mul(q(2, 3), q(3, 4)), q(1, 2))).toBe(true);
    expect(egal(div(q(1, 2), q(1, 4)), q(2))).toBe(true);
    expect(egal(sub(q(1), q(1, 3)), q(2, 3))).toBe(true);
  });

  it('refuse la division par zéro', () => {
    expect(() => q(1, 0)).toThrow();
  });

  it('formate en français', () => {
    expect(formater(q(5, 2), { type: 'decimal' })).toBe('2,5');
    expect(formater(q(7, 4), { type: 'decimal', unite: '€' })).toBe('1,75 €');
    expect(formater(q(3, 1), { type: 'decimal' })).toBe('3');
    expect(formater(q(3, 4), { type: 'fraction' })).toBe('3/4');
    expect(formater(q(-3, 2), { type: 'decimal' })).toBe('-1,5');
  });

  it('détecte ce qui n’est pas représentable', () => {
    expect(formatable(q(1, 3), { type: 'decimal' })).toBe(false);
    expect(formatable(q(1, 8), { type: 'decimal' })).toBe(false);
    expect(formatable(q(1, 2), { type: 'entier' })).toBe(false);
    expect(() => formater(q(1, 3), { type: 'decimal' })).toThrow();
  });
});
