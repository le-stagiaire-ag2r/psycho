import type { Item } from '../lib/types';

interface Props {
  item: Item;
  /** Choix déjà fait (mode entraînement : on affiche alors la correction) */
  choix: number | null;
  onChoisir(index: number): void;
}

function Stimulus({ item }: { item: Item }) {
  const s = item.stimulus;
  if (s.type === 'attention') {
    return (
      <div className="suites" aria-label={`Suite 1 : ${s.a.split('').join(' ')}. Suite 2 : ${s.b.split('').join(' ')}`}>
        <div className="suite" aria-hidden="true">{s.a}</div>
        <div className="suite" aria-hidden="true">{s.b}</div>
      </div>
    );
  }
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
}

export default function QuestionView({ item, choix, onChoisir }: Props) {
  const corrige = choix !== null;
  return (
    <div className="question">
      <Stimulus item={item} />
      <p className="consigne">{item.consigne}</p>
      <div className={`options options-${item.options.length}`} role="group" aria-label="Propositions">
        {item.options.map((o, i) => {
          let classe = 'option';
          if (corrige && i === item.bonneReponse) classe += ' option-bonne';
          else if (corrige && i === choix) classe += ' option-mauvaise';
          return (
            <button key={i} type="button" className={classe} disabled={corrige} onClick={() => onChoisir(i)}>
              <kbd>{i + 1}</kbd> {o}
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
