import type { Item } from '../lib/types';
import GrilleSvg from './GrilleSvg';

interface Props {
  item: Item;
  /** Choix déjà fait (mode entraînement : on affiche alors la correction) */
  choix: number | null;
  onChoisir(index: number): void;
}

function Stimulus({ item }: { item: Item }) {
  const s = item.stimulus;
  switch (s.type) {
    case 'attention':
      return (
        <div className="suites" aria-label={`Suite 1 : ${s.a.split('').join(' ')}. Suite 2 : ${s.b.split('').join(' ')}`}>
          <div className="suite" aria-hidden="true">{s.a}</div>
          <div className="suite" aria-hidden="true">{s.b}</div>
        </div>
      );
    case 'codage':
      return (
        <table className="tableau-codage">
          <caption className="visuellement-cache">Tableau de codage : mots et numéros</caption>
          <tbody>
            <tr>
              {s.tableau.map((e) => (
                <th key={e.mot} scope="col">{e.mot}</th>
              ))}
            </tr>
            <tr>
              {s.tableau.map((e) => (
                <td key={e.mot}>{e.numero}</td>
              ))}
            </tr>
          </tbody>
        </table>
      );
    case 'grille':
      return (
        <figure className="modele-grille">
          <GrilleSvg grille={s.modele} cellule={34} libelle="Grille de départ" />
          <figcaption>Grille de départ</figcaption>
        </figure>
      );
    case 'texte':
      return <p className="enonce">{s.enonce}</p>;
  }
}

export default function QuestionView({ item, choix, onChoisir }: Props) {
  const corrige = choix !== null;
  const graphique = item.stimulus.type === 'grille';
  return (
    <div className="question">
      <Stimulus item={item} />
      <p className="consigne">{item.consigne}</p>
      <div
        className={`options options-${item.options.length} ${graphique ? 'options-graphiques' : ''}`}
        role="group"
        aria-label="Propositions"
      >
        {item.options.map((o, i) => {
          let classe = 'option';
          if (corrige && i === item.bonneReponse) classe += ' option-bonne';
          else if (corrige && i === choix) classe += ' option-mauvaise';
          const s = item.stimulus;
          return (
            <button
              key={i}
              type="button"
              className={classe}
              disabled={corrige}
              onClick={() => onChoisir(i)}
              aria-label={s.type === 'grille' ? `Proposition ${o}` : undefined}
            >
              <kbd>{i + 1}</kbd> {s.type === 'grille' ? <><strong>{o}</strong><GrilleSvg grille={s.propositions[i]} cellule={22} libelle={`Proposition ${o}`} /></> : o}
            </button>
          );
        })}
      </div>
      {corrige && (
        <p className={`correction ${choix === item.bonneReponse ? 'correction-ok' : 'correction-ko'}`} role="status">
          <strong>{choix === item.bonneReponse ? 'Bonne réponse. ' : 'Raté. '}</strong>
          {item.explication}
        </p>
      )}
    </div>
  );
}
