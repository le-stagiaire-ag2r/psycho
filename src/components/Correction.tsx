import type { Item } from '../lib/types';

interface Props {
  item: Item;
  /** Proposition choisie (null = question non traitée) */
  choix: number | null;
}

/**
 * Correction pédagogique : pourquoi ma réponse est fausse, pourquoi la bonne est juste,
 * la règle à retenir, et le sort de chaque proposition.
 */
export default function Correction({ item, choix }: Props) {
  const juste = choix === item.bonneReponse;
  const libelle = (i: number) => item.options[i];
  return (
    <div className={`correction ${juste ? 'correction-ok' : 'correction-ko'}`} role="status">
      <p className="correction-verdict">
        <strong>{juste ? 'Bonne réponse.' : choix === null ? 'Question non traitée.' : 'Raté.'}</strong>
      </p>
      {!juste && choix !== null && (
        <p>
          <strong>Pourquoi « {libelle(choix)} » est faux :</strong> {item.pourquoi[choix]}
        </p>
      )}
      <p>
        <strong>
          {juste ? 'Pourquoi c’est juste' : `La bonne réponse était « ${libelle(item.bonneReponse)} »`} :
        </strong>{' '}
        {item.pourquoi[item.bonneReponse]}
      </p>
      {!item.pourquoi[item.bonneReponse].includes(item.explication) && (
        <p>
          <strong>À retenir :</strong> {item.explication}
        </p>
      )}
      <details className="correction-toutes">
        <summary>Voir toutes les propositions</summary>
        <ul>
          {item.options.map((o, i) => (
            <li key={i} className={i === item.bonneReponse ? 'prop-bonne' : 'prop-fausse'}>
              <span aria-hidden="true">{i === item.bonneReponse ? '✓' : '✗'}</span>{' '}
              <strong>{o}</strong> <span className="visuellement-cache">{i === item.bonneReponse ? '(bonne réponse)' : '(fausse)'}</span> — {item.pourquoi[i]}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
