import type { Item } from '../lib/types';
import CubeSvg, { PatronSvg } from './CubeSvg';
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
    case 'attention-series':
      return (
        <ol className="series" aria-label="Séries à comparer">
          {s.series.map((x, i) => (
            <li key={i} className="serie" aria-label={`Série ${i + 1} : ${x.split('').join(' ')}`}>
              <span className="serie-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="serie-code" aria-hidden="true">
                {x}
              </span>
            </li>
          ))}
        </ol>
      );
    case 'codage':
      return (
        <ul className="grille-codage" aria-label="Tableau de codage : mots et codes">
          {s.tableau.map((e) => (
            <li key={e.mot} className="cellule-codage">
              <span className="codage-mot">{e.mot}</span>
              <span className="codage-code">{e.numero}</span>
            </li>
          ))}
        </ul>
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
    case 'cube':
      return s.modele.forme === 'patron' ? (
        <figure className="modele-cube">
          <PatronSvg patron={s.modele.patron} />
          <figcaption>Patron à plier (les symboles sont à l’extérieur du cube)</figcaption>
        </figure>
      ) : (
        <div className="modele-cube modele-vues">
          <figure>
            <CubeSvg vue={s.modele.vues[0]} libelle="Cube modèle, vue 1" />
            <figcaption>Vue 1</figcaption>
          </figure>
          <figure>
            <CubeSvg vue={s.modele.vues[1]} libelle="Cube modèle, vue 2 (angle opposé)" />
            <figcaption>Vue 2 : le même cube vu du côté opposé</figcaption>
          </figure>
        </div>
      );
    case 'suite-cubes':
      return (
        <div className="suite-cubes" role="group" aria-label="Suite de cubes">
          {s.suite.map((v, i) => (
            <div key={i} className="etape-cube">
              <CubeSvg vue={v} libelle={`Cube ${i + 1}`} />
              <span aria-hidden="true" className="fleche">→</span>
            </div>
          ))}
          <div className="etape-cube etape-inconnue" aria-label="Cube à trouver">?</div>
        </div>
      );
  }
}

/** Miniature d'une proposition (image pour les épreuves graphiques, texte sinon) : réutilisée dans la correction. */
export function Miniature({ item, index }: { item: Item; index: number }) {
  const s = item.stimulus;
  const o = item.options[index];
  if (s.type === 'grille') {
    return (
      <span className="miniature">
        <strong>{o}</strong>
        <GrilleSvg grille={s.propositions[index]} cellule={16} libelle={`Proposition ${o}`} />
      </span>
    );
  }
  if (s.type === 'cube' || s.type === 'suite-cubes') {
    return (
      <span className="miniature">
        <strong>{o}</strong>
        <CubeSvg vue={s.propositions[index]} libelle={`Proposition ${o}`} />
      </span>
    );
  }
  return <span>{o}</span>;
}

export default function QuestionView({ item, choix, onChoisir }: Props) {
  const corrige = choix !== null;
  const graphique = ['grille', 'cube', 'suite-cubes'].includes(item.stimulus.type);
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
              aria-label={graphique ? `Proposition ${o}` : undefined}
            >
              <kbd>{i + 1}</kbd>
              {s.type === 'grille' ? (
                <>
                  <strong>{o}</strong>
                  <GrilleSvg grille={s.propositions[i]} cellule={22} libelle={`Proposition ${o}`} />
                </>
              ) : s.type === 'cube' || s.type === 'suite-cubes' ? (
                <>
                  <strong>{o}</strong>
                  <CubeSvg vue={s.propositions[i]} libelle={`Proposition ${o}`} />
                </>
              ) : (
                <span className="option-texte">{o}</span>
              )}
              {corrige && i === item.bonneReponse && <span className="option-marque" aria-hidden="true">✓</span>}
              {corrige && i === choix && i !== item.bonneReponse && <span className="option-marque" aria-hidden="true">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
