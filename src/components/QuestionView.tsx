import type { Item } from '../lib/types';
import CubeSvg, { PatronSvg } from './CubeSvg';
import GrilleSvg from './GrilleSvg';
import Correction from './Correction';

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
              <kbd>{i + 1}</kbd>{' '}
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
                o
              )}
            </button>
          );
        })}
      </div>
      {corrige && <Correction item={item} choix={choix} />}
    </div>
  );
}
