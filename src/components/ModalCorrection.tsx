import { useEffect, useRef } from 'react';
import type { Item } from '../lib/types';
import Correction from './Correction';

interface Props {
  items: Item[];
  reponses: (number | null)[];
  /** Indices des questions déjà répondues, dans l'ordre */
  ordre: number[];
  /** Position (dans `ordre`) de la question affichée */
  vue: number;
  onVue(position: number): void;
  onFermer(): void;
  /** Passe à la question suivante de la séance (depuis la dernière correction) */
  onSuivant(): void;
  libelleSuivant: string;
}

/** Texte court qui rappelle de quelle question on parle. */
function rappel(item: Item): string {
  const s = item.stimulus;
  if (s.type === 'texte') return s.enonce;
  if (s.type === 'attention') return `${s.a}  /  ${s.b}`;
  if (s.type === 'attention-series') return s.series.join('  ·  ');
  return item.consigne;
}

/**
 * Fenêtre de correction (pop-up) : explique l'erreur sans quitter la question,
 * avec navigation « précédente / suivante » entre les corrections de la séance.
 */
export default function ModalCorrection({ items, reponses, ordre, vue, onVue, onFermer, onSuivant, libelleSuivant }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // Le focus va sur le bouton principal (Entrée = suite), pas sur la croix.
    d?.querySelector<HTMLButtonElement>('[data-principal]')?.focus();
    return () => d?.close();
  }, []);

  const i = ordre[vue];
  const item = items[i];
  const choix = reponses[i];
  const derniere = vue === ordre.length - 1;
  const juste = choix === item.bonneReponse;

  const suivante = () => (derniere ? onSuivant() : onVue(vue + 1));
  const precedente = () => vue > 0 && onVue(vue - 1);

  return (
    <dialog
      ref={ref}
      className="modale"
      aria-labelledby="modale-titre"
      onCancel={(e) => {
        e.preventDefault();
        onFermer();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') precedente();
        else if (e.key === 'ArrowRight') suivante();
      }}
    >
      <header className="modale-tete">
        <h2 id="modale-titre" className={juste ? 'titre-ok' : 'titre-ko'}>
          {juste ? 'Bonne réponse' : 'Raté'}
          <span className="modale-compteur"> · question {vue + 1} / {ordre.length}</span>
        </h2>
        <button type="button" className="modale-fermer" onClick={onFermer} aria-label="Fermer la correction">
          ✕
        </button>
      </header>
      <p className="modale-rappel">{rappel(item)}</p>
      <div className="modale-corps">
        <Correction item={item} choix={choix} />
      </div>
      <footer className="modale-pied">
        <button type="button" className="bouton bouton-secondaire" onClick={precedente} disabled={vue === 0}>
          ← Précédente
        </button>
        <button type="button" className="bouton" onClick={suivante} data-principal>
          {derniere ? libelleSuivant : 'Suivante'} →
        </button>
      </footer>
    </dialog>
  );
}
