import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import personnalite from './data/personnalite.json';

function fichiers(dir: string): string[] {
  return readdirSync(dir).flatMap((nom) => {
    const chemin = join(dir, nom);
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin];
  });
}

const SOURCES = fichiers('src').filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith('.test.ts'));

describe('confidentialité : rien ne quitte l’appareil', () => {
  it('le code de l’appli ne contient aucun appel réseau', () => {
    const interdits = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /WebSocket/, /EventSource/, /navigator\.sendBeacon/];
    for (const f of SOURCES) {
      const texte = readFileSync(f, 'utf8');
      for (const motif of interdits) expect(`${f} : ${motif.test(texte)}`).toBe(`${f} : false`);
    }
  });

  it('la page personnalité n’utilise ni stockage ni historique', () => {
    const texte = readFileSync('src/pages/Personnalite.tsx', 'utf8');
    expect(texte).not.toMatch(/localStorage|sessionStorage|indexedDB|useStockage|ajouterResultat/);
  });

  it('les seuls liens externes sont le dépôt GitHub (signalement et code)', () => {
    for (const f of SOURCES) {
      const hotes = [...readFileSync(f, 'utf8').matchAll(/https?:\/\/([a-z0-9.-]+)/gi)].map((m) => m[1]);
      for (const h of hotes) {
        expect(['github.com', 'openapi.vercel.sh', 'creativecommons.org', 'vercel.com', 'www.w3.org']).toContain(h);
      }
    }
  });
});

describe('questionnaire de personnalité (mode découverte)', () => {
  const items = (personnalite as { items: { id: string; dimension: string; texte: string }[] }).items;

  it('contient 50 affirmations, 10 par dimension, sans doublon', () => {
    expect(items).toHaveLength(50);
    expect(new Set(items.map((i) => i.id)).size).toBe(50);
    expect(new Set(items.map((i) => i.texte)).size).toBe(50);
    const parDim = new Map<string, number>();
    for (const i of items) parDim.set(i.dimension, (parDim.get(i.dimension) ?? 0) + 1);
    expect([...parDim.keys()].sort()).toEqual(['agreabilite', 'conscience', 'extraversion', 'ouverture', 'stabilite']);
    for (const n of parDim.values()) expect(n).toBe(10);
  });

  it('ne contient aucune information de cotation (pas de score possible)', () => {
    for (const i of items) expect(Object.keys(i).sort()).toEqual(['dimension', 'id', 'texte']);
  });
});
