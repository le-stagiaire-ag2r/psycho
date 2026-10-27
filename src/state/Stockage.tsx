import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  analyserImport,
  charger,
  donneesParDefaut,
  exporter,
  fusionner,
  sauver,
  stockageNavigateur,
  MAX_HISTORIQUE,
  MAX_RESOLUES,
  type Donnees,
  type Prefs,
  type ResultatSeance,
} from '../lib/storage';

interface ContexteStockage {
  donnees: Donnees;
  /** false si le navigateur bloque le stockage : la progression ne sera pas conservée */
  stockageDispo: boolean;
  majPrefs(p: Partial<Prefs>): void;
  ajouterResultat(r: ResultatSeance): void;
  /** Marque des questions comme maîtrisées (réussies en révision) */
  marquerResolues(ids: string[]): void;
  exporterJson(): string;
  /** Fusionne un export dans l'historique ; retourne false si le fichier est invalide */
  importerJson(texte: string): boolean;
  reinitialiser(): void;
}

const Ctx = createContext<ContexteStockage | null>(null);

export function StockageProvider({ children }: { children: ReactNode }) {
  const st = useRef(stockageNavigateur());
  const [donnees, setDonnees] = useState<Donnees>(() => charger(st.current));

  // Applique le thème choisi (clair/sombre) ; "auto" suit le système.
  useEffect(() => {
    const racine = document.documentElement;
    if (donnees.prefs.theme === 'auto') racine.removeAttribute('data-theme');
    else racine.setAttribute('data-theme', donnees.prefs.theme);
  }, [donnees.prefs.theme]);

  const maj = useCallback((fn: (d: Donnees) => Donnees) => {
    setDonnees((prec) => {
      const suivant = fn(prec);
      sauver(st.current, suivant);
      return suivant;
    });
  }, []);

  const valeur = useMemo<ContexteStockage>(
    () => ({
      donnees,
      stockageDispo: st.current !== null,
      majPrefs: (p) => maj((d) => ({ ...d, prefs: { ...d.prefs, ...p } })),
      ajouterResultat: (r) =>
        maj((d) => ({ ...d, historique: [...d.historique, r].slice(-MAX_HISTORIQUE) })),
      marquerResolues: (ids) =>
        maj((d) => ({
          ...d,
          erreursResolues: [...new Set([...d.erreursResolues, ...ids])].slice(-MAX_RESOLUES),
        })),
      exporterJson: () => exporter(donnees),
      importerJson: (texte) => {
        const importees = analyserImport(texte);
        if (!importees) return false;
        maj((d) => fusionner(d, importees));
        return true;
      },
      reinitialiser: () => maj(() => donneesParDefaut()),
    }),
    [donnees, maj],
  );

  return <Ctx.Provider value={valeur}>{children}</Ctx.Provider>;
}

export function useStockage(): ContexteStockage {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStockage hors StockageProvider');
  return c;
}
