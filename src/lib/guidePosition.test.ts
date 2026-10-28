import { describe, expect, it } from 'vitest';
import { calculerPlacement, MARGE, type Rect } from './guidePosition';

const ECRANS = [
  { nom: 'petit téléphone', largeur: 320, hauteur: 568 },
  { nom: 'téléphone', largeur: 390, hauteur: 844 },
  { nom: 'téléphone paysage', largeur: 844, hauteur: 390 },
  { nom: 'tablette portrait', largeur: 768, hauteur: 1024 },
  { nom: 'tablette paysage', largeur: 1024, hauteur: 768 },
  { nom: 'ordinateur', largeur: 1440, hauteur: 900 },
];

function chevauche(a: Rect, b: Rect): boolean {
  return a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;
}

describe('placement de la bulle du guide', () => {
  for (const e of ECRANS) {
    it(`${e.nom} : la bulle reste dans l'écran et ne recouvre pas la cible quand c'est possible`, () => {
      const ecran = { largeur: e.largeur, hauteur: e.hauteur };
      const tailles = [
        { w: 60, h: 24 },
        { w: 140, h: 44 },
        { w: e.largeur - 24, h: 80 },
        { w: e.largeur - 24, h: Math.round(e.hauteur / 3) },
        { w: Math.min(900, e.largeur - 24), h: Math.round(e.hauteur / 2) },
      ];
      for (const t of tailles) {
        for (const hc of [160, 260, 420, 900]) {
          for (let ty = 0; ty <= e.hauteur - Math.min(t.h, e.hauteur); ty += Math.max(20, Math.round(e.hauteur / 12))) {
            for (let tx = 0; tx <= e.largeur - Math.min(t.w, e.largeur); tx += Math.max(20, Math.round(e.largeur / 8))) {
              const cible: Rect = { top: ty, left: tx, width: Math.min(t.w, e.largeur), height: Math.min(t.h, e.hauteur) };
              const p = calculerPlacement(cible, ecran, hc);
              const { top, left, width, hauteur } = p.carte;
              const ou = `${e.nom} cible=${JSON.stringify(cible)} contenu=${hc}`;
              expect(left, ou).toBeGreaterThanOrEqual(MARGE - 0.01);
              expect(top, ou).toBeGreaterThanOrEqual(MARGE - 0.01);
              expect(left + width, ou).toBeLessThanOrEqual(e.largeur - MARGE + 0.01);
              expect(top + hauteur, ou).toBeLessThanOrEqual(e.hauteur - MARGE + 0.01);
              if (p.mode === 'bulle') {
                expect(chevauche({ top, left, width, height: hauteur }, cible), `${ou} : recouvre la cible`).toBe(false);
              }
            }
          }
        }
      }
    });

    it(`${e.nom} : sans cible, la bulle est centrée et entière`, () => {
      const p = calculerPlacement(null, { largeur: e.largeur, hauteur: e.hauteur }, 5000);
      expect(p.mode).toBe('centre');
      expect(p.carte.top + p.carte.hauteur).toBeLessThanOrEqual(e.hauteur - MARGE + 0.01);
      expect(p.carte.left + p.carte.width).toBeLessThanOrEqual(e.largeur - MARGE + 0.01);
    });
  }
});
